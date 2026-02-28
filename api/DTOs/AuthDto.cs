using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public record RegisterDto(
    [Required, MinLength(2)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, Phone] string Phone,
    string Role = "Customer"   // Customer | Provider | BusinessOwner
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    string Role,
    string FullName,
    int UserId
);