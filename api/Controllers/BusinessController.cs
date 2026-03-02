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
        [FromQuery] int pageSize = 10
    )
    {
        var query = _db
            .Businesses.Include(b => b.Provider.User)
            .Where(b => b.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(b => b.City.ToLower().Contains(city.ToLower()));

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(b =>
                b.Name.ToLower().Contains(keyword.ToLower())
                || b.Description.ToLower().Contains(keyword.ToLower())
            );

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => ToDto(b))
            .ToListAsync();

        return Ok(
            ApiResponse<PagedResponse<BusinessResponseDto>>.Ok(
                new PagedResponse<BusinessResponseDto>
                {
                    Items = items,
                    TotalCount = total,
                    Page = page,
                    PageSize = pageSize,
                }
            )
        );
    }

    /// <summary>İşletme detayı</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<BusinessResponseDto>>> GetById(int id)
    {
        var b = await _db
            .Businesses.Include(b => b.Provider.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (b is null)
            return NotFound(ApiResponse<BusinessResponseDto>.Fail("İşletme bulunamadı."));
        return Ok(ApiResponse<BusinessResponseDto>.Ok(ToDto(b)));
    }

    /// <summary>Kendi işletmelerini listele (Provider)</summary>
    [HttpGet("my")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<List<BusinessResponseDto>>>> GetMine()
    {
        var provider = await GetProviderAsync();
        if (provider is null)
            return BadRequest(
                ApiResponse<List<BusinessResponseDto>>.Fail("Provider profili bulunamadı.")
            );

        var businesses = await _db
            .Businesses.Include(b => b.Provider.User)
            .Where(b => b.ProviderId == provider.Id && b.IsActive)
            .Select(b => ToDto(b))
            .ToListAsync();

        return Ok(ApiResponse<List<BusinessResponseDto>>.Ok(businesses));
    }

    /// <summary>Yeni işletme oluştur</summary>
    [HttpPost]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<BusinessResponseDto>>> Create(BusinessDto dto)
    {
        var provider = await GetProviderAsync();
        if (provider is null)
            return BadRequest(
                ApiResponse<BusinessResponseDto>.Fail("Önce bir provider profili oluşturmalısınız.")
            );

        var b = new Business
        {
            Name = dto.Name,
            Description = dto.Description,
            Address = dto.Address,
            City = dto.City,
            Phone = dto.Phone,
            Email = dto.Email,
            Website = dto.Website,
            ProviderId = provider.Id,
        };

        _db.Businesses.Add(b);
        await _db.SaveChangesAsync();
        await _db.Entry(b).Reference(x => x.Provider).LoadAsync();
        await _db.Entry(b.Provider).Reference(p => p.User).LoadAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = b.Id },
            ApiResponse<BusinessResponseDto>.Ok(ToDto(b), "İşletme oluşturuldu.")
        );
    }

    /// <summary>İşletme güncelle</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<BusinessResponseDto>>> Update(
        int id,
        BusinessDto dto
    )
    {
        var b = await _db
            .Businesses.Include(b => b.Provider.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (b is null)
            return NotFound(ApiResponse<BusinessResponseDto>.Fail("İşletme bulunamadı."));
        if (!await IsOwnerAsync(b.ProviderId))
            return Forbid();

        b.Name = dto.Name;
        b.Description = dto.Description;
        b.Address = dto.Address;
        b.City = dto.City;
        b.Phone = dto.Phone;
        b.Email = dto.Email;
        b.Website = dto.Website;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<BusinessResponseDto>.Ok(ToDto(b)));
    }

    /// <summary>İşletme sil</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var b = await _db.Businesses.FindAsync(id);
        if (b is null)
            return NotFound(ApiResponse<object>.Fail("İşletme bulunamadı."));
        if (!await IsOwnerAsync(b.ProviderId))
            return Forbid();

        b.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "İşletme kaldırıldı."));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<Provider?> GetProviderAsync()
    {
        var userId = GetUserId();
        return await _db.Providers.FirstOrDefaultAsync(p => p.UserId == userId);
    }

    private async Task<bool> IsOwnerAsync(int providerId)
    {
        if (User.IsInRole("Admin"))
            return true;
        var provider = await GetProviderAsync();
        return provider?.Id == providerId;
    }

    private static BusinessResponseDto ToDto(Business b) =>
        new(
            b.Id,
            b.Name,
            b.Description,
            b.Address,
            b.City,
            b.Phone,
            b.Email,
            b.Website,
            b.LogoUrl,
            b.IsVerified,
            b.ProviderId,
            b.Provider?.User?.FullName ?? ""
        );
}
