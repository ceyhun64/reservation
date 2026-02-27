namespace api.Models;

public class Appointment
{
    public int Id { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Notes { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int ServiceId { get; set; }
    public Service Service { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}