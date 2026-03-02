using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record BusinessDto(
    [Required, MinLength(2)] string Name,
    string Description,
    [Required] string Address,
    [Required] string City,
    [Required, Phone] string Phone,
    string? Email,
    string? Website
);

public record BusinessResponseDto(
    int Id,
    string Name,
    string Description,
    string Address,
    string City,
    string Phone,
    string? Email,
    string? Website,
    string? LogoUrl,
    bool IsVerified,
    int OwnerId,
    string OwnerName
);
