namespace api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // Customer | Provider | BusinessOwner | Admin
    public string Role { get; set; } = "Customer";

    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Customer: aldığı randevular
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    // Provider: bu kullanıcıya ait provider profili (varsa)
    public Provider? ProviderProfile { get; set; }

    // BusinessOwner: sahip olduğu işletmeler
    public ICollection<Business> OwnedBusinesses { get; set; } = new List<Business>();

    // Kullanıcının verdiği değerlendirmeler
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}