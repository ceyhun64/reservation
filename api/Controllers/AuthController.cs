using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using api.Common;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
    private readonly ICacheService _cache;
    private readonly ITwoFactorService _twoFactor;

    // Cookie name stored in the browser for 30-day device trust
    private const string TrustedDeviceCookie = "trusted_device";

    public AuthController(
        AppDbContext db,
        IConfiguration config,
        IEmailService email,
        ICacheService cache,
        ITwoFactorService twoFactor
    )
    {
        _db = db;
        _config = config;
        _email = email;
        _cache = cache;
        _twoFactor = twoFactor;
    }

    // ── Register ──────────────────────────────────────────────────────────────

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(
                ApiResponse<AuthResponseDto>.Fail("Bu e-posta adresi zaten kayıtlı.")
            );

        var validRoles = new[] { "Receiver", "Provider", "Admin" };
        if (!validRoles.Contains(dto.Role))
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Geçersiz rol."));

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _email.SendWelcomeAsync(user.Email, user.FullName, user.Role);

        var token = GenerateToken(user);
        return Ok(
            ApiResponse<AuthResponseDto>.Ok(
                new AuthResponseDto(token, user.Role, user.FullName, user.Id),
                "Kayıt başarılı."
            )
        );
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login(LoginDto dto)
    {
        var user = await _db
            .Users.Include(u => u.TrustedDevices)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("E-posta veya şifre hatalı."));

        if (!user.IsActive)
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Hesabınız askıya alınmış."));

        // ── 2FA check ─────────────────────────────────────────────────────────
        if (user.TwoFactorEnabled)
        {
            // Check for a trusted-device cookie set by a previous "Remember device" login
            var rawCookie = Request.Cookies[TrustedDeviceCookie];
            if (rawCookie is not null)
            {
                var hash = HashToken(rawCookie);
                var trusted = user.TrustedDevices.FirstOrDefault(d =>
                    d.TokenHash == hash && d.IsValid()
                );

                if (trusted is not null)
                {
                    // Trusted device — skip 2FA, issue JWT directly
                    user.LastLoginAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                    return Ok(
                        ApiResponse<AuthResponseDto>.Ok(
                            new AuthResponseDto(
                                GenerateToken(user),
                                user.Role,
                                user.FullName,
                                user.Id
                            )
                        )
                    );
                }

                // Cookie exists but is stale/revoked — clear it
                Response.Cookies.Delete(TrustedDeviceCookie);
            }

            // 2FA required: issue a short-lived temp token (5 min, cached)
            var tempToken = Guid.NewGuid().ToString("N");
            await _cache.SetAsync(
                $"2fa_pending:{tempToken}",
                user.Id.ToString(),
                TimeSpan.FromMinutes(5)
            );

            return Ok(
                ApiResponse<AuthResponseDto>.Ok(
                    new AuthResponseDto(
                        null,
                        null,
                        null,
                        null,
                        RequiresTwoFactor: true,
                        TempToken: tempToken
                    )
                )
            );
        }
        // ──────────────────────────────────────────────────────────────────────

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(
            ApiResponse<AuthResponseDto>.Ok(
                new AuthResponseDto(GenerateToken(user), user.Role, user.FullName, user.Id)
            )
        );
    }

    // ── 2FA: Complete login ───────────────────────────────────────────────────

    /// <summary>
    /// Second step of login when 2FA is enabled.
    /// Accepts the temp token from /login and the 6-digit TOTP code.
    /// </summary>
    [HttpPost("2fa/verify")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> VerifyTwoFactor(
        TwoFactorVerifyDto dto
    )
    {
        // Resolve temp token → userId
        var cached = await _cache.GetAsync<string>($"2fa_pending:{dto.TempToken}");
        if (cached is null)
            return Unauthorized(
                ApiResponse<AuthResponseDto>.Fail(
                    "Oturum süresi dolmuş. Lütfen tekrar giriş yapın."
                )
            );

        if (!int.TryParse(cached, out var userId))
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Geçersiz oturum."));

        var user = await _db.Users.FindAsync(userId);
        if (user is null || !user.TwoFactorEnabled || user.TwoFactorSecret is null)
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("2FA aktif değil."));

        if (!_twoFactor.VerifyCode(user.TwoFactorSecret, dto.Code))
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Geçersiz doğrulama kodu."));

        // Consume the temp token so it can't be replayed
        await _cache.RemoveAsync($"2fa_pending:{dto.TempToken}");

        // ── Remember this device for 30 days ──────────────────────────────────
        if (dto.RememberDevice)
        {
            var rawToken = GenerateSecureToken();
            var expiry = DateTime.UtcNow.AddDays(30);

            _db.Set<TrustedDevice>()
                .Add(
                    new TrustedDevice
                    {
                        UserId = user.Id,
                        TokenHash = HashToken(rawToken),
                        ExpiresAt = expiry,
                        UserAgent = Request.Headers.UserAgent.ToString(),
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    }
                );
            await _db.SaveChangesAsync();

            Response.Cookies.Append(
                TrustedDeviceCookie,
                rawToken,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None, // cross-origin dev: localhost:3000 → :5000
                    Expires = DateTimeOffset.UtcNow.AddDays(30),
                    Path = "/api/auth", // only sent to auth endpoints
                }
            );
        }
        // ──────────────────────────────────────────────────────────────────────

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(
            ApiResponse<AuthResponseDto>.Ok(
                new AuthResponseDto(GenerateToken(user), user.Role, user.FullName, user.Id)
            )
        );
    }

    // ── 2FA: Setup ────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns a new TOTP secret + QR-code URI. The secret is NOT saved to the
    /// database yet — the client must call /2fa/enable with a valid code first.
    /// </summary>
    [HttpGet("2fa/setup")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<TwoFactorSetupResponseDto>>> GetTwoFactorSetup()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var email = User.FindFirstValue(ClaimTypes.Email)!;

        var secret = _twoFactor.GenerateSecret();
        var uri = _twoFactor.GetQrCodeUri(email, secret);

        // Secret'ı burada kaydet — confirm-secret endpoint'i artık gerekmiyor
        await _cache.SetAsync($"2fa_setup:{userId}", secret, TimeSpan.FromMinutes(10));

        return Ok(
            ApiResponse<TwoFactorSetupResponseDto>.Ok(new TwoFactorSetupResponseDto(secret, uri))
        );
    }

    /// <summary>Confirm the secret by submitting the first valid code, then enable 2FA.</summary>
    [HttpPost("2fa/enable")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<string>>> EnableTwoFactor(TwoFactorEnableDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user is null)
            return NotFound(ApiResponse<string>.Fail("Kullanıcı bulunamadı."));
        if (user.TwoFactorEnabled)
            return BadRequest(ApiResponse<string>.Fail("2FA zaten etkin."));

        // The client must pass the secret it received from /2fa/setup via a
        // short-lived cache entry (key = userId, stored during GetTwoFactorSetup)
        var pendingSecret = await _cache.GetAsync<string>($"2fa_setup:{userId}");
        if (pendingSecret is null)
            return BadRequest(
                ApiResponse<string>.Fail("Kurulum süresi dolmuş. Lütfen tekrar başlatın.")
            );

        if (!_twoFactor.VerifyCode(pendingSecret, dto.Code))
            return BadRequest(ApiResponse<string>.Fail("Geçersiz doğrulama kodu."));

        user.TwoFactorSecret = pendingSecret;
        user.TwoFactorEnabled = true;
        await _cache.RemoveAsync($"2fa_setup:{userId}");
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("ok", "İki adımlı doğrulama etkinleştirildi."));
    }

    /// <summary>
    /// Saves the pending secret to Redis so /2fa/enable can retrieve it.
    /// Call this right after /2fa/setup, passing the secret back.
    /// </summary>
    [HttpPost("2fa/setup/confirm-secret")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<string>>> ConfirmPendingSecret(
        [FromBody] string secret
    )
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Store for 10 minutes — enough time for the user to scan and confirm
        await _cache.SetAsync($"2fa_setup:{userId}", secret, TimeSpan.FromMinutes(10));
        return Ok(ApiResponse<string>.Ok("ok"));
    }

    /// <summary>Disable 2FA. Requires a valid TOTP code to confirm intent.</summary>
    [HttpPost("2fa/disable")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<string>>> DisableTwoFactor(TwoFactorDisableDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db
            .Users.Include(u => u.TrustedDevices)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return NotFound(ApiResponse<string>.Fail("Kullanıcı bulunamadı."));
        if (!user.TwoFactorEnabled)
            return BadRequest(ApiResponse<string>.Fail("2FA zaten kapalı."));
        if (!_twoFactor.VerifyCode(user.TwoFactorSecret!, dto.Code))
            return BadRequest(ApiResponse<string>.Fail("Geçersiz doğrulama kodu."));

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;

        // Revoke all trusted devices
        _db.Set<TrustedDevice>().RemoveRange(user.TrustedDevices);
        await _db.SaveChangesAsync();

        Response.Cookies.Delete(TrustedDeviceCookie);

        return Ok(ApiResponse<string>.Ok("ok", "İki adımlı doğrulama devre dışı bırakıldı."));
    }

    // ── 2FA: Status ───────────────────────────────────────────────────────────

    [HttpGet("2fa/status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetTwoFactorStatus()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db
            .Users.Include(u => u.TrustedDevices)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return NotFound();

        // Clean up expired trusted devices
        var expired = user.TrustedDevices.Where(d => !d.IsValid()).ToList();
        if (expired.Count > 0)
        {
            _db.Set<TrustedDevice>().RemoveRange(expired);
            await _db.SaveChangesAsync();
        }

        return Ok(
            ApiResponse<object>.Ok(
                new
                {
                    enabled = user.TwoFactorEnabled,
                    trustedDevices = user
                        .TrustedDevices.Where(d => d.IsValid())
                        .Select(d => new
                        {
                            d.Id,
                            d.UserAgent,
                            d.IpAddress,
                            d.CreatedAt,
                            d.ExpiresAt,
                        }),
                }
            )
        );
    }

    // ── 2FA: Revoke a specific trusted device ────────────────────────────────

    [HttpDelete("2fa/trusted-devices/{deviceId:int}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<string>>> RevokeTrustedDevice(int deviceId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var device = await _db.Set<TrustedDevice>()
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.UserId == userId);

        if (device is null)
            return NotFound(ApiResponse<string>.Fail("Cihaz bulunamadı."));

        _db.Set<TrustedDevice>().Remove(device);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("ok", "Cihaz güven listesinden çıkarıldı."));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string GenerateToken(User user)
    {
        var secret = _config["Jwt:Secret"] ?? "fallback_test_secret_key_must_be_32chars!!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.Name, user.FullName),
        };

        var expireMinutes = double.TryParse(_config["Jwt:ExpireMinutes"], out var m) ? m : 60;

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "test-issuer",
            audience: _config["Jwt:Audience"] ?? "test-audience",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>SHA-256 hash of a raw token string.</summary>
    private static string HashToken(string raw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>Cryptographically random 256-bit token encoded as hex.</summary>
    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
