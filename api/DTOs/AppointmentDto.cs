using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record AppointmentCreateDto(
    [Required] int ProviderId,
    [Required] int ServiceId,
    [Required] int TimeSlotId,
    string? ReceiverNotes
);

public record AppointmentUpdateStatusDto(
    [Required] string Action, // confirm | reject | complete | noshow
    string? Reason
);

public record AppointmentFilterDto(
    string? Status,
    DateTime? From,
    DateTime? To,
    int Page = 1,
    int PageSize = 10
);

public record AppointmentResponseDto(
    int Id,
    int ReceiverId,
    string ReceiverName,
    int ProviderId,
    string ProviderName,
    int ServiceId,
    string ServiceName,
    string CategoryName,
    DateTime StartTime,
    DateTime EndTime,
    decimal PricePaid,
    string Status,
    string? ReceiverNotes,
    string? ProviderNotes,
    string? CancellationReason,
    bool HasReview,
    DateTime CreatedAt
);
