namespace api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // Receiver | Provider | Admin
    public string Role { get; set; } = "Receiver";
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Two-Factor Authentication ─────────────────────────────────────────────
    public bool TwoFactorEnabled { get; set; } = false;

    /// <summary>
    /// Base-32 encoded TOTP secret. Null until the user completes 2FA setup.
    /// </summary>
    public string? TwoFactorSecret { get; set; }

    // ──────────────────────────────────────────────────────────────────────────

    // Receiver: aldığı randevular
    public ICollection<Appointment> ReceivedAppointments { get; set; } = new List<Appointment>();

    // Provider: bu kullanıcıya ait provider profili (varsa, 1-1)
    public Provider? ProviderProfile { get; set; }

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<TrustedDevice> TrustedDevices { get; set; } = new List<TrustedDevice>();
}
