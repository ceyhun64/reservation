using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record ServiceDto(
    [Required, MinLength(2)] string Name,
    string Description,
    [Range(0, 99999)] decimal Price,
    [Range(5, 480)] int DurationMinutes,
    [Required] int CategoryId,
    [Required] int BusinessId
);

public record ServiceResponseDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    int DurationMinutes,
    int CategoryId,
    string CategoryName,
    int BusinessId,
    string BusinessName
);