namespace api.Models;

/// <summary>
/// Provider'ın randevu için müsait olduğu zaman dilimleri.
/// Randevu oluşturulduğunda ilgili slot "dolu" olarak işaretlenir.
/// </summary>
public class TimeSlot
{
    public int Id { get; set; }

    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public SlotStatus Status { get; set; } = SlotStatus.Available;

    // Bu slot bir randevuya bağlandıysa
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum SlotStatus
{
    Available,
    Booked,
    Blocked, // Provider tarafından bloke edildi (izin, mola vb.)
    Expired,
}
