using System.Security.Claims;
using api.Common;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/services")]
public class ServiceController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServiceController(AppDbContext db) => _db = db;

    /// <summary>Hizmet listesi (kategori, işletme, provider filtresi)</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ServiceResponseDto>>>> GetAll(
        [FromQuery] int? categoryId,
        [FromQuery] int? businessId,
        [FromQuery] int? providerId,
        [FromQuery] string? keyword
    )
    {
        var query = _db
            .Services.Include(s => s.Category)
            .Include(s => s.Business)
                .ThenInclude(b => b.Provider.User)
            .Where(s => s.IsActive)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(s =>
                s.CategoryId == categoryId || s.Category.ParentCategoryId == categoryId
            );

        if (businessId.HasValue)
            query = query.Where(s => s.BusinessId == businessId);

        if (providerId.HasValue)
            query = query.Where(s => s.Business.ProviderId == providerId);

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(s => s.Name.ToLower().Contains(keyword.ToLower()));

        var result = await query.Select(s => ToDto(s)).ToListAsync();
        return Ok(ApiResponse<List<ServiceResponseDto>>.Ok(result));
    }

    /// <summary>Hizmet detayı</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ServiceResponseDto>>> GetById(int id)
    {
        var s = await _db
            .Services.Include(s => s.Category)
            .Include(s => s.Business)
                .ThenInclude(b => b.Provider.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (s is null)
            return NotFound(ApiResponse<ServiceResponseDto>.Fail("Hizmet bulunamadı."));
        return Ok(ApiResponse<ServiceResponseDto>.Ok(ToDto(s)));
    }

    /// <summary>Yeni hizmet oluştur</summary>
    [HttpPost]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<ServiceResponseDto>>> Create(ServiceDto dto)
    {
        var business = await _db
            .Businesses.Include(b => b.Provider)
            .FirstOrDefaultAsync(b => b.Id == dto.BusinessId);

        if (business is null)
            return NotFound(ApiResponse<ServiceResponseDto>.Fail("İşletme bulunamadı."));
        if (!await IsOwnerAsync(business.ProviderId))
            return Forbid();

        if (!await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId && c.IsActive))
            return BadRequest(ApiResponse<ServiceResponseDto>.Fail("Kategori bulunamadı."));

        var service = new Service
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            DurationMinutes = dto.DurationMinutes,
            CategoryId = dto.CategoryId,
            BusinessId = dto.BusinessId,
        };

        _db.Services.Add(service);
        await _db.SaveChangesAsync();
        await _db.Entry(service).Reference(s => s.Category).LoadAsync();
        await _db.Entry(service).Reference(s => s.Business).LoadAsync();
        await _db.Entry(service.Business).Reference(b => b.Provider).LoadAsync();
        await _db.Entry(service.Business.Provider).Reference(p => p.User).LoadAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = service.Id },
            ApiResponse<ServiceResponseDto>.Ok(ToDto(service), "Hizmet oluşturuldu.")
        );
    }

    /// <summary>Hizmet güncelle</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<ServiceResponseDto>>> Update(int id, ServiceDto dto)
    {
        var s = await _db
            .Services.Include(s => s.Category)
            .Include(s => s.Business)
                .ThenInclude(b => b.Provider.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (s is null)
            return NotFound(ApiResponse<ServiceResponseDto>.Fail("Hizmet bulunamadı."));
        if (!await IsOwnerAsync(s.Business.ProviderId))
            return Forbid();

        s.Name = dto.Name;
        s.Description = dto.Description;
        s.Price = dto.Price;
        s.DurationMinutes = dto.DurationMinutes;
        s.CategoryId = dto.CategoryId;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<ServiceResponseDto>.Ok(ToDto(s)));
    }

    /// <summary>Hizmet sil (soft delete)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var s = await _db.Services.Include(s => s.Business).FirstOrDefaultAsync(s => s.Id == id);

        if (s is null)
            return NotFound(ApiResponse<object>.Fail("Hizmet bulunamadı."));
        if (!await IsOwnerAsync(s.Business.ProviderId))
            return Forbid();

        s.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Hizmet kaldırıldı."));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsOwnerAsync(int providerId)
    {
        if (User.IsInRole("Admin"))
            return true;
        var userId = GetUserId();
        var provider = await _db.Providers.FirstOrDefaultAsync(p => p.UserId == userId);
        return provider?.Id == providerId;
    }

    private static ServiceResponseDto ToDto(Service s) =>
        new(
            s.Id,
            s.Name,
            s.Description,
            s.Price,
            s.DurationMinutes,
            s.CategoryId,
            s.Category?.Name ?? "",
            s.BusinessId,
            s.Business?.Name ?? "",
            s.Business?.ProviderId ?? 0,
            s.Business?.Provider?.User?.FullName ?? ""
        );
}
