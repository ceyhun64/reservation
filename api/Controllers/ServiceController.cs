using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using api.Common;
using api.Data;
using api.DTOs;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/services")]
public class ServiceController : ControllerBase
{
    private readonly AppDbContext _db;
    public ServiceController(AppDbContext db) => _db = db;

    /// <summary>Hizmet listesi (kategori ve işletmeye göre filtre)</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ServiceResponseDto>>>> GetAll(
        [FromQuery] int? categoryId,
        [FromQuery] int? businessId,
        [FromQuery] string? keyword)
    {
        var query = _db.Services
            .Include(s => s.Category)
            .Include(s => s.Business)
            .Where(s => s.IsActive)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(s => s.CategoryId == categoryId ||
                                     s.Category.ParentCategoryId == categoryId);

        if (businessId.HasValue)
            query = query.Where(s => s.BusinessId == businessId);

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(s => s.Name.ToLower().Contains(keyword.ToLower()));

        var result = await query.Select(s => ToDto(s)).ToListAsync();
        return Ok(ApiResponse<List<ServiceResponseDto>>.Ok(result));
    }

    /// <summary>Hizmet detayı</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ServiceResponseDto>>> GetById(int id)
    {
        var s = await _db.Services
            .Include(s => s.Category)
            .Include(s => s.Business)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (s is null) return NotFound(ApiResponse<ServiceResponseDto>.Fail("Hizmet bulunamadı."));
        return Ok(ApiResponse<ServiceResponseDto>.Ok(ToDto(s)));
    }

    /// <summary>Yeni hizmet oluştur</summary>
    [HttpPost]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<ServiceResponseDto>>> Create(ServiceDto dto)
    {
        var userId = GetUserId();

        var business = await _db.Businesses.FindAsync(dto.BusinessId);
        if (business is null) return NotFound(ApiResponse<ServiceResponseDto>.Fail("İşletme bulunamadı."));
        if (business.OwnerId != userId && !User.IsInRole("Admin")) return Forbid();

        if (!await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId && c.IsActive))
            return BadRequest(ApiResponse<ServiceResponseDto>.Fail("Kategori bulunamadı."));

        var service = new Service
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            DurationMinutes = dto.DurationMinutes,
            CategoryId = dto.CategoryId,
            BusinessId = dto.BusinessId
        };

        _db.Services.Add(service);
        await _db.SaveChangesAsync();
        await _db.Entry(service).Reference(s => s.Category).LoadAsync();
        await _db.Entry(service).Reference(s => s.Business).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = service.Id },
            ApiResponse<ServiceResponseDto>.Ok(ToDto(service), "Hizmet oluşturuldu."));
    }

    /// <summary>Hizmet güncelle</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<ServiceResponseDto>>> Update(int id, ServiceDto dto)
    {
        var userId = GetUserId();
        var s = await _db.Services
            .Include(s => s.Category).Include(s => s.Business)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (s is null) return NotFound(ApiResponse<ServiceResponseDto>.Fail("Hizmet bulunamadı."));
        if (s.Business.OwnerId != userId && !User.IsInRole("Admin")) return Forbid();

        s.Name = dto.Name; s.Description = dto.Description;
        s.Price = dto.Price; s.DurationMinutes = dto.DurationMinutes;
        s.CategoryId = dto.CategoryId;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<ServiceResponseDto>.Ok(ToDto(s)));
    }

    /// <summary>Hizmet sil</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var userId = GetUserId();
        var s = await _db.Services.Include(s => s.Business).FirstOrDefaultAsync(s => s.Id == id);

        if (s is null) return NotFound(ApiResponse<object>.Fail("Hizmet bulunamadı."));
        if (s.Business.OwnerId != userId && !User.IsInRole("Admin")) return Forbid();

        s.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Hizmet kaldırıldı."));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ServiceResponseDto ToDto(Service s) =>
        new(s.Id, s.Name, s.Description, s.Price, s.DurationMinutes,
            s.CategoryId, s.Category?.Name ?? "",
            s.BusinessId, s.Business?.Name ?? "");
}