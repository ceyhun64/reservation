using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

// ── Category ─────────────────────────────────────────────────────────────────

public record CategoryDto(
    [Required, MinLength(2)] string Name,
    string Description,
    string? IconUrl,
    int? ParentCategoryId,
    int DisplayOrder = 0
);

public record CategoryResponseDto(
    int Id,
    string Name,
    string Description,
    string Slug,
    string? IconUrl,
    int DisplayOrder,
    int? ParentCategoryId,
    string? ParentCategoryName,
    List<CategoryResponseDto>? SubCategories
);
