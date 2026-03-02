namespace api.Models;

public class Appointment
{
    public int Id { get; set; }

    // Randevu ALAN (müşteri / receiver)
    public int ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;

    // Randevu VEREN (provider - hem şirket sahibi hem çalışan)
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    // Alınan hizmet (bir işletmenin hizmeti)
    public int ServiceId { get; set; }
    public Service Service { get; set; } = null!;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public decimal PricePaid { get; set; }

    // Durum makinesi: Pending → Confirmed → Completed
    //                          └→ CancelledByReceiver
    //                          └→ Rejected
    //                          └→ NoShow
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

    public string? ReceiverNotes { get; set; }
    public string? ProviderNotes { get; set; }
    public string? CancellationReason { get; set; }

    // İlgili zaman slotu
    public int? TimeSlotId { get; set; }
    public TimeSlot? TimeSlot { get; set; }

    // Değerlendirme
    public Review? Review { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public enum AppointmentStatus
{
    Pending, // Onay bekleniyor
    Confirmed, // Onaylandı
    Completed, // Tamamlandı
    CancelledByReceiver, // Müşteri iptal etti
    Rejected, // Provider reddetti
    NoShow, // Müşteri gelmedi
}
