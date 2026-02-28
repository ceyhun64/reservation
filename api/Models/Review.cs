namespace api.Models;

public class Review
{
    public int Id { get; set; }

    // Kim yazdı
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;

    // Kim hakkında
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    // Hangi randevuya ait (bir randevuya sadece 1 yorum)
    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;

    public int Rating { get; set; }         // 1-5
    public string? Comment { get; set; }

    public bool IsVisible { get; set; } = true;  // Admin moderasyonu

    // Provider'ın cevabı
    public string? ProviderReply { get; set; }
    public DateTime? ProviderRepliedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}