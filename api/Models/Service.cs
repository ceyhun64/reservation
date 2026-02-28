namespace api.Models;

public class Service
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Hangi kategoriye ait (Sağlık, Güzellik, Eğlence vb.)
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    // Hangi işletmenin hizmeti
    public int BusinessId { get; set; }
    public Business Business { get; set; } = null!;

    // Bu hizmeti kim verebilir (many-to-many)
    public ICollection<ProviderService> ProviderServices { get; set; } = new List<ProviderService>();

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}