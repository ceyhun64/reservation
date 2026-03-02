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
[Route("api/providers")]
public class ProviderController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProviderController(AppDbContext db) => _db = db;

    /// <summary>Provider arama + filtreleme</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<ProviderResponseDto>>>> Search(
        [FromQuery] ProviderSearchDto filter
    )
    {
        var query = _db
            .Providers.Include(p => p.User)
            .Include(p => p.Business)
            .Include(p => p.ProviderServices)
                .ThenInclude(ps => ps.Service)
                    .ThenInclude(s => s.Category)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Keyword))
            query = query.Where(p =>
                p.User.FullName.ToLower().Contains(filter.Keyword.ToLower())
                || p.Title.ToLower().Contains(filter.Keyword.ToLower())
                || p.Bio.ToLower().Contains(filter.Keyword.ToLower())
            );

        if (filter.CategoryId.HasValue)
            query = query.Where(p =>
                p.ProviderServices.Any(ps =>
                    ps.Service.CategoryId == filter.CategoryId
                    || ps.Service.Category.ParentCategoryId == filter.CategoryId
                )
            );

        if (!string.IsNullOrWhiteSpace(filter.City))
            query = query.Where(p =>
                p.Business != null && p.Business.City.ToLower().Contains(filter.City.ToLower())
            );

        if (filter.MaxPrice.HasValue)
            query = query.Where(p =>
                p.ProviderServices.Any(ps =>
                    (ps.CustomPrice ?? ps.Service.Price) <= filter.MaxPrice
                )
            );

        if (filter.MinRating.HasValue)
            query = query.Where(p => p.AverageRating >= filter.MinRating);

        var total = await query.CountAsync();
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => ToDto(p))
            .ToListAsync();

        return Ok(
            ApiResponse<PagedResponse<ProviderResponseDto>>.Ok(
                new PagedResponse<ProviderResponseDto>
                {
                    Items = items,
                    TotalCount = total,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                }
            )
        );
    }

    /// <summary>Provider detayı</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProviderResponseDto>>> GetById(int id)
    {
        var p = await _db
            .Providers.Include(p => p.User)
            .Include(p => p.Business)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p is null)
            return NotFound(ApiResponse<ProviderResponseDto>.Fail("Provider bulunamadı."));
        return Ok(ApiResponse<ProviderResponseDto>.Ok(ToDto(p)));
    }

    /// <summary>Provider profili oluştur (kullanıcı kendisi için)</summary>
    [HttpPost]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<ProviderResponseDto>>> Create(ProviderDto dto)
    {
        var userId = GetUserId();

        if (await _db.Providers.AnyAsync(p => p.UserId == userId))
            return BadRequest(
                ApiResponse<ProviderResponseDto>.Fail(
                    "Bu kullanıcının zaten bir provider profili var."
                )
            );

        if (dto.BusinessId.HasValue)
        {
            var biz = await _db.Businesses.FindAsync(dto.BusinessId);
            if (biz is null)
                return BadRequest(ApiResponse<ProviderResponseDto>.Fail("İşletme bulunamadı."));
        }

        var provider = new Provider
        {
            UserId = userId,
            BusinessId = dto.BusinessId,
            Title = dto.Title,
            Bio = dto.Bio,
            AcceptsOnlineBooking = dto.AcceptsOnlineBooking,
        };

        _db.Providers.Add(provider);
        await _db.SaveChangesAsync();
        await _db.Entry(provider).Reference(p => p.User).LoadAsync();
        if (provider.BusinessId.HasValue)
            await _db.Entry(provider).Reference(p => p.Business).LoadAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = provider.Id },
            ApiResponse<ProviderResponseDto>.Ok(ToDto(provider), "Provider profili oluşturuldu.")
        );
    }

    /// <summary>Provider profilini güncelle</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<ProviderResponseDto>>> Update(
        int id,
        ProviderDto dto
    )
    {
        var userId = GetUserId();
        var p = await _db
            .Providers.Include(p => p.User)
            .Include(p => p.Business)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p is null)
            return NotFound(ApiResponse<ProviderResponseDto>.Fail("Provider bulunamadı."));
        if (p.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        p.Title = dto.Title;
        p.Bio = dto.Bio;
        p.BusinessId = dto.BusinessId;
        p.AcceptsOnlineBooking = dto.AcceptsOnlineBooking;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<ProviderResponseDto>.Ok(ToDto(p)));
    }

    /// <summary>Provider'a hizmet ekle</summary>
    [HttpPost("{id}/services")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> AddService(
        int id,
        [FromBody] AddProviderServiceDto dto
    )
    {
        var userId = GetUserId();
        var p = await _db.Providers.FindAsync(id);
        if (p is null)
            return NotFound(ApiResponse<object>.Fail("Provider bulunamadı."));
        if (p.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        var service = await _db.Services.FindAsync(dto.ServiceId);
        if (service is null)
            return NotFound(ApiResponse<object>.Fail("Hizmet bulunamadı."));

        if (
            await _db.ProviderServices.AnyAsync(ps =>
                ps.ProviderId == id && ps.ServiceId == dto.ServiceId
            )
        )
            return BadRequest(ApiResponse<object>.Fail("Bu hizmet zaten eklenmiş."));

        _db.ProviderServices.Add(
            new ProviderService
            {
                ProviderId = id,
                ServiceId = dto.ServiceId,
                CustomPrice = dto.CustomPrice,
                CustomDurationMinutes = dto.CustomDurationMinutes,
            }
        );

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Hizmet eklendi."));
    }

    /// <summary>Provider'ın sunduğu hizmetler</summary>
    [HttpGet("{id}/services")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetServices(int id)
    {
        var services = await _db
            .ProviderServices.Include(ps => ps.Service)
                .ThenInclude(s => s.Category)
            .Where(ps => ps.ProviderId == id && ps.IsActive)
            .Select(ps => new
            {
                ps.Service.Id,
                ps.Service.Name,
                ps.Service.Description,
                Price = ps.CustomPrice ?? ps.Service.Price,
                DurationMinutes = ps.CustomDurationMinutes ?? ps.Service.DurationMinutes,
                CategoryName = ps.Service.Category.Name,
            })
            .ToListAsync();

        return Ok(ApiResponse<List<object>>.Ok(services.Cast<object>().ToList()));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ProviderResponseDto ToDto(Provider p) =>
        new(
            p.Id,
            p.UserId,
            p.User?.FullName ?? "",
            p.BusinessId,
            p.Business?.Name,
            p.Title,
            p.Bio,
            p.ProfileImageUrl,
            p.AverageRating,
            p.TotalReviews,
            p.AcceptsOnlineBooking
        );
}

public record AddProviderServiceDto(
    int ServiceId,
    decimal? CustomPrice,
    int? CustomDurationMinutes
);
