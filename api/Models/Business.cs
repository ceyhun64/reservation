namespace api.Models;

public class Business
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsVerified { get; set; } = false;

    // Bu işletmenin sahibi olan Provider
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    // İşletmenin sunduğu hizmetler
    public ICollection<Service> Services { get; set; } = new List<Service>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
