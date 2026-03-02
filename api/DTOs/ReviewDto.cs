using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

// ── Review ────────────────────────────────────────────────────────────────────

public record ReviewCreateDto(
    [Required] int AppointmentId,
    [Required, Range(1, 5)] int Rating,
    string? Comment
);

public record ReviewReplyDto([Required, MinLength(2)] string Reply);

public record ReviewResponseDto(
    int Id,
    string AuthorName,
    int ProviderId,
    string ProviderName,
    int AppointmentId,
    int Rating,
    string? Comment,
    string? ProviderReply,
    DateTime CreatedAt
);
