using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

// ── Auth ──────────────────────────────────────────────────────────────────────

public record RegisterDto(
    [Required, MinLength(2)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, Phone] string Phone,
    string Role = "Receiver"
);

public record LoginDto([Required, EmailAddress] string Email, [Required] string Password);

/// <summary>
/// Returned by /login and /2fa/verify.
/// When RequiresTwoFactor is true, Token/Role/FullName/UserId are null and
/// TempToken must be forwarded to /2fa/verify.
/// </summary>
public record AuthResponseDto(
    string? Token,
    string? Role,
    string? FullName,
    int? UserId,
    bool RequiresTwoFactor = false,
    string? TempToken = null
);

// ── 2FA ───────────────────────────────────────────────────────────────────────

/// <summary>Response from GET /2fa/setup — shown to the user before enabling.</summary>
public record TwoFactorSetupResponseDto(string Secret, string QrCodeUri);

/// <summary>Enable 2FA after scanning the QR code.</summary>
public record TwoFactorEnableDto([Required, StringLength(6, MinimumLength = 6)] string Code);

/// <summary>Disable 2FA (requires a valid TOTP code to confirm identity).</summary>
public record TwoFactorDisableDto([Required, StringLength(6, MinimumLength = 6)] string Code);

/// <summary>Complete login when 2FA is required.</summary>
public record TwoFactorVerifyDto(
    [Required] string TempToken,
    [Required, StringLength(6, MinimumLength = 6)] string Code,
    bool RememberDevice = false
);
