using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

// ── Provider ──────────────────────────────────────────────────────────────────

public record ProviderDto(
    [Required, MinLength(2)] string Title,
    [Required] string Bio,
    bool AcceptsOnlineBooking = true
);

public record ProviderResponseDto(
    int Id,
    int UserId,
    string UserFullName,
    string Title,
    string Bio,
    string? ProfileImageUrl,
    double AverageRating,
    int TotalReviews,
    bool AcceptsOnlineBooking,
    List<BusinessSummaryDto> Businesses
);

public record BusinessSummaryDto(int Id, string Name, string City);

public record ProviderSearchDto(
    string? Keyword,
    int? CategoryId,
    string? City,
    decimal? MaxPrice,
    double? MinRating,
    int Page = 1,
    int PageSize = 10
);
