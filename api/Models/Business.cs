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

    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public ICollection<Service> Services { get; set; } = new List<Service>();

    // Bir işletmede birden fazla uzman/provider çalışabilir
    public ICollection<Provider> Providers { get; set; } = new List<Provider>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}