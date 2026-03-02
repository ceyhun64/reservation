using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record TimeSlotCreateDto([Required] DateTime StartTime, [Required] DateTime EndTime);

public record BulkTimeSlotCreateDto(
    [Required] DateTime Date, // Hangi gün
    [Required] TimeSpan WorkStart, // 09:00
    [Required] TimeSpan WorkEnd, // 18:00
    [Range(15, 480)] int SlotMinutes // Kaçar dakikalık slot
);

public record TimeSlotResponseDto(
    int Id,
    int ProviderId,
    DateTime StartTime,
    DateTime EndTime,
    string Status
);
