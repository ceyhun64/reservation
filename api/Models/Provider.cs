namespace api.Models;

/// <summary>
/// Randevu VEREN tarafı temsil eder.
/// Hem bir işletmeye bağlı çalışan (doktor, kuaför) hem de bağımsız freelancer olabilir.
/// </summary>
public class Provider
{
    public int Id { get; set; }

    // Provider'ın kullanıcı hesabı (1-1)
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Opsiyonel: Bir işletmeye bağlıysa
    public int? BusinessId { get; set; }
    public Business? Business { get; set; }

    public string Title { get; set; } = string.Empty; // "Dr.", "Uzm.", "Trainer" vb.
    public string Bio { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }

    // Ortalama puan (0-5), hesaplanır
    public double AverageRating { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    public bool IsActive { get; set; } = true;
    public bool AcceptsOnlineBooking { get; set; } = true;

    // Provider'ın sunduğu hizmetler (many-to-many)
    public ICollection<ProviderService> ProviderServices { get; set; } =
        new List<ProviderService>();

    // Müsaitlik slotları
    public ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();

    // Aldığı randevular
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    // Hakkında yapılan değerlendirmeler
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
