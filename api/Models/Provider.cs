namespace api.Models;

/// <summary>
/// Randevu VEREN tarafı temsil eder.
/// Provider hem işletme sahibi hem de tek çalışandır.
/// Birden fazla işletmeye sahip olabilir.
/// </summary>
public class Provider
{
    public int Id { get; set; }

    // Provider'ın kullanıcı hesabı (1-1)
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty; // "Berber", "Fitness Koçu", "Dr." vb.
    public string Bio { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }

    // Ortalama puan (0-5), hesaplanır
    public double AverageRating { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    public bool IsActive { get; set; } = true;
    public bool AcceptsOnlineBooking { get; set; } = true;

    // Provider'ın sahip olduğu işletmeler
    public ICollection<Business> Businesses { get; set; } = new List<Business>();

    // Müsaitlik slotları
    public ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();

    // Verdiği randevular
    public ICollection<Appointment> GivenAppointments { get; set; } = new List<Appointment>();

    // Hakkında yapılan değerlendirmeler
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
