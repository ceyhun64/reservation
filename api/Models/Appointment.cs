namespace api.Models;

public class Appointment
{
    public int Id { get; set; }

    // Randevu ALAN (müşteri)
    public int ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;

    // Randevu VEREN (uzman/provider)
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    // Alınan hizmet
    public int ServiceId { get; set; }
    public Service Service { get; set; } = null!;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public decimal PricePaid { get; set; }

    // Durum makinesi: Pending → Confirmed → Completed
    //                          └→ CancelledByReceiver
    //                          └→ CancelledByProvider
    //                          └→ NoShow
    //                          └→ Rejected
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

    public string? ReceiverNotes { get; set; }      // Müşteri notu
    public string? ProviderNotes { get; set; }      // Provider notu (interne)
    public string? CancellationReason { get; set; }

    // İlgili zaman slotu
    public int? TimeSlotId { get; set; }
    public TimeSlot? TimeSlot { get; set; }

    // Değerlendirme yapıldı mı?
    public Review? Review { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public enum AppointmentStatus
{
    Pending,                // Bekliyor (onay bekleniyor)
    Confirmed,              // Onaylandı
    Completed,              // Tamamlandı
    CancelledByReceiver,    // Müşteri iptal etti
    CancelledByProvider,    // Provider iptal etti
    Rejected,               // Provider reddetti
    NoShow                  // Müşteri gelmedi
}