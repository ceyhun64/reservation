using api.Common;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoryController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoryController(AppDbContext db) => _db = db;

    /// <summary>Tüm kategoriler (ağaç yapısında)</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryResponseDto>>>> GetAll()
    {
        var all = await _db
            .Categories.Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        // Sadece kök kategorileri döndür, alt kategoriler içinde
        var roots = all.Where(c => c.ParentCategoryId == null)
            .Select(c => MapToDto(c, all))
            .ToList();

        return Ok(ApiResponse<List<CategoryResponseDto>>.Ok(roots));
    }

    /// <summary>Tek kategori detayı</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CategoryResponseDto>>> GetById(int id)
    {
        var all = await _db.Categories.Where(c => c.IsActive).ToListAsync();
        var cat = all.FirstOrDefault(c => c.Id == id);
        if (cat is null)
            return NotFound(ApiResponse<CategoryResponseDto>.Fail("Kategori bulunamadı."));

        return Ok(ApiResponse<CategoryResponseDto>.Ok(MapToDto(cat, all)));
    }

    /// <summary>Yeni kategori oluştur (Admin)</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CategoryResponseDto>>> Create(CategoryDto dto)
    {
        if (
            dto.ParentCategoryId.HasValue
            && !await _db.Categories.AnyAsync(c => c.Id == dto.ParentCategoryId)
        )
            return BadRequest(ApiResponse<CategoryResponseDto>.Fail("Üst kategori bulunamadı."));

        var slug = GenerateSlug(dto.Name);
        if (await _db.Categories.AnyAsync(c => c.Slug == slug))
            slug = $"{slug}-{DateTime.UtcNow.Ticks}";

        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            Slug = slug,
            IconUrl = dto.IconUrl,
            ParentCategoryId = dto.ParentCategoryId,
            DisplayOrder = dto.DisplayOrder,
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = category.Id },
            ApiResponse<CategoryResponseDto>.Ok(MapToDto(category, new List<Category>()))
        );
    }

    /// <summary>Kategori güncelle (Admin)</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CategoryResponseDto>>> Update(
        int id,
        CategoryDto dto
    )
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null)
            return NotFound(ApiResponse<CategoryResponseDto>.Fail("Kategori bulunamadı."));

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.IconUrl = dto.IconUrl;
        category.ParentCategoryId = dto.ParentCategoryId;
        category.DisplayOrder = dto.DisplayOrder;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<CategoryResponseDto>.Ok(MapToDto(category, new List<Category>())));
    }

    /// <summary>Kategori sil (Admin)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null)
            return NotFound(ApiResponse<object>.Fail("Kategori bulunamadı."));

        category.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Kategori kaldırıldı."));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static CategoryResponseDto MapToDto(Category c, List<Category> all) =>
        new(
            c.Id,
            c.Name,
            c.Description,
            c.Slug,
            c.IconUrl,
            c.DisplayOrder,
            c.ParentCategoryId,
            c.ParentCategoryId.HasValue
                ? all.FirstOrDefault(p => p.Id == c.ParentCategoryId)?.Name
                : null,
            all.Where(sub => sub.ParentCategoryId == c.Id)
                .Select(sub => MapToDto(sub, all))
                .ToList()
        );

    private static string GenerateSlug(string name) =>
        name.ToLower()
            .Replace(" ", "-")
            .Replace("ı", "i")
            .Replace("ğ", "g")
            .Replace("ü", "u")
            .Replace("ş", "s")
            .Replace("ö", "o")
            .Replace("ç", "c")
            .Replace("İ", "i")
            .Replace("Ğ", "g")
            .Replace("Ü", "u")
            .Replace("Ş", "s")
            .Replace("Ö", "o")
            .Replace("Ç", "c");
}
