using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

// ── TimeSlot ──────────────────────────────────────────────────────────────────

public record TimeSlotCreateDto([Required] DateTime StartTime, [Required] DateTime EndTime);

public record BulkTimeSlotCreateDto(
    [Required] DateTime Date,
    [Required] TimeSpan WorkStart,
    [Required] TimeSpan WorkEnd,
    [Range(15, 480)] int SlotMinutes
);

public record TimeSlotResponseDto(
    int Id,
    int ProviderId,
    DateTime StartTime,
    DateTime EndTime,
    string Status
);
