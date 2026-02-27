namespace api.DTOs;

public class AppointmentDto
{
    public DateTime StartTime { get; set; }
    public int ServiceId { get; set; }
    public string? Notes { get; set; }
}