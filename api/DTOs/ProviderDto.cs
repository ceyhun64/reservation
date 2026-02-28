using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record ProviderDto(
    [Required, MinLength(2)] string Title,
    [Required]               string Bio,
    int? BusinessId,
    bool AcceptsOnlineBooking = true
);

public record ProviderResponseDto(
    int Id,
    int UserId,
    string UserFullName,
    int? BusinessId,
    string? BusinessName,
    string Title,
    string Bio,
    string? ProfileImageUrl,
    double AverageRating,
    int TotalReviews,
    bool AcceptsOnlineBooking
);

public record ProviderSearchDto(
    string? Keyword,
    int? CategoryId,
    string? City,
    decimal? MaxPrice,
    double? MinRating,
    int Page = 1,
    int PageSize = 10
);