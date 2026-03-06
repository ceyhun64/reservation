using OtpNet;

namespace api.Services;

// ── Interface ─────────────────────────────────────────────────────────────────

public interface ITwoFactorService
{
    /// <summary>Generates a cryptographically random Base-32 TOTP secret.</summary>
    string GenerateSecret();

    /// <summary>Builds a standard otpauth:// URI that QR-code scanners understand.</summary>
    string GetQrCodeUri(string email, string secret);

    /// <summary>
    /// Verifies a 6-digit TOTP code against the given secret.
    /// Allows a ±1 window (±30 s) to tolerate clock drift.
    /// </summary>
    bool VerifyCode(string secret, string code);
}

// ── Implementation ────────────────────────────────────────────────────────────

public class TwoFactorService : ITwoFactorService
{
    private const string Issuer = "Rezervo";

    public string GenerateSecret()
    {
        // 20 random bytes → 160-bit key (TOTP RFC recommendation)
        var key = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(key);
    }

    public string GetQrCodeUri(string email, string secret)
    {
        var label = Uri.EscapeDataString($"{Issuer}:{email}");
        var iss   = Uri.EscapeDataString(Issuer);
        return $"otpauth://totp/{label}?secret={secret}&issuer={iss}&algorithm=SHA1&digits=6&period=30";
    }

    public bool VerifyCode(string secret, string code)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length != 6) return false;

        try
        {
            var key  = Base32Encoding.ToBytes(secret);
            var totp = new Totp(key);
            // VerificationWindow.RfcSpecifiedNetworkDelay → accepts current + previous window
            return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
        }
        catch
        {
            return false;
        }
    }
}