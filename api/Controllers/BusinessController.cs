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
[Route("api/businesses")]
public class BusinessController : ControllerBase
{
    private readonly AppDbContext _db;
    public BusinessController(AppDbContext db) => _db = db;

    /// <summary>Tüm işletmeleri listele (filtrelenebilir)</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<BusinessResponseDto>>>> GetAll(
        [FromQuery] string? city,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _db.Businesses
            .Include(b => b.Owner)
            .Where(b => b.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(b => b.City.ToLower().Contains(city.ToLower()));

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(b => b.Name.ToLower().Contains(keyword.ToLower()) ||
                                     b.Description.ToLower().Contains(keyword.ToLower()));

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => ToDto(b))
            .ToListAsync();

        return Ok(ApiResponse<PagedResponse<BusinessResponseDto>>.Ok(new PagedResponse<BusinessResponseDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        }));
    }

    /// <summary>İşletme detayı</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<BusinessResponseDto>>> GetById(int id)
    {
        var b = await _db.Businesses.Include(b => b.Owner).FirstOrDefaultAsync(b => b.Id == id);
        if (b is null) return NotFound(ApiResponse<BusinessResponseDto>.Fail("İşletme bulunamadı."));
        return Ok(ApiResponse<BusinessResponseDto>.Ok(ToDto(b)));
    }

    /// <summary>Yeni işletme oluştur</summary>
    [HttpPost]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<BusinessResponseDto>>> Create(BusinessDto dto)
    {
        var userId = GetUserId();
        var b = new Business
        {
            Name = dto.Name,
            Description = dto.Description,
            Address = dto.Address,
            City = dto.City,
            Phone = dto.Phone,
            Email = dto.Email,
            Website = dto.Website,
            OwnerId = userId
        };

        _db.Businesses.Add(b);
        await _db.SaveChangesAsync();
        await _db.Entry(b).Reference(x => x.Owner).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = b.Id },
            ApiResponse<BusinessResponseDto>.Ok(ToDto(b), "İşletme oluşturuldu."));
    }

    /// <summary>İşletme güncelle</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<BusinessResponseDto>>> Update(int id, BusinessDto dto)
    {
        var userId = GetUserId();
        var b = await _db.Businesses.Include(b => b.Owner).FirstOrDefaultAsync(b => b.Id == id);

        if (b is null) return NotFound(ApiResponse<BusinessResponseDto>.Fail("İşletme bulunamadı."));
        if (b.OwnerId != userId && !User.IsInRole("Admin")) return Forbid();

        b.Name = dto.Name; b.Description = dto.Description; b.Address = dto.Address;
        b.City = dto.City; b.Phone = dto.Phone; b.Email = dto.Email; b.Website = dto.Website;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<BusinessResponseDto>.Ok(ToDto(b)));
    }

    /// <summary>İşletme sil</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var userId = GetUserId();
        var b = await _db.Businesses.FindAsync(id);

        if (b is null) return NotFound(ApiResponse<object>.Fail("İşletme bulunamadı."));
        if (b.OwnerId != userId && !User.IsInRole("Admin")) return Forbid();

        b.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "İşletme kaldırıldı."));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static BusinessResponseDto ToDto(Business b) =>
        new(b.Id, b.Name, b.Description, b.Address, b.City,
            b.Phone, b.Email, b.Website, b.LogoUrl, b.IsVerified,
            b.OwnerId, b.Owner?.FullName ?? "");
}