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
            .Include(p => p.Businesses)
                .ThenInclude(b => b.Services)
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
                p.Businesses.Any(b =>
                    b.Services.Any(s =>
                        s.CategoryId == filter.CategoryId
                        || s.Category.ParentCategoryId == filter.CategoryId
                    )
                )
            );

        if (!string.IsNullOrWhiteSpace(filter.City))
            query = query.Where(p =>
                p.Businesses.Any(b => b.City.ToLower().Contains(filter.City.ToLower()))
            );

        if (filter.MaxPrice.HasValue)
            query = query.Where(p =>
                p.Businesses.Any(b => b.Services.Any(s => s.Price <= filter.MaxPrice))
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
            .Include(p => p.Businesses)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p is null)
            return NotFound(ApiResponse<ProviderResponseDto>.Fail("Provider bulunamadı."));
        return Ok(ApiResponse<ProviderResponseDto>.Ok(ToDto(p)));
    }

    /// <summary>Kendi provider profilim</summary>
    [HttpGet("me")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<ProviderResponseDto>>> GetMe()
    {
        var userId = GetUserId();
        var p = await _db
            .Providers.Include(p => p.User)
            .Include(p => p.Businesses)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (p is null)
            return NotFound(ApiResponse<ProviderResponseDto>.Fail("Provider profili bulunamadı."));
        return Ok(ApiResponse<ProviderResponseDto>.Ok(ToDto(p)));
    }

    /// <summary>Provider profili oluştur</summary>
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

        var provider = new Provider
        {
            UserId = userId,
            Title = dto.Title,
            Bio = dto.Bio,
            AcceptsOnlineBooking = dto.AcceptsOnlineBooking,
        };

        _db.Providers.Add(provider);
        await _db.SaveChangesAsync();
        await _db.Entry(provider).Reference(p => p.User).LoadAsync();

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
            .Include(p => p.Businesses)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p is null)
            return NotFound(ApiResponse<ProviderResponseDto>.Fail("Provider bulunamadı."));
        if (p.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        p.Title = dto.Title;
        p.Bio = dto.Bio;
        p.AcceptsOnlineBooking = dto.AcceptsOnlineBooking;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<ProviderResponseDto>.Ok(ToDto(p)));
    }

    /// <summary>Provider'ın sunduğu tüm hizmetler (tüm işletmelerden)</summary>
    [HttpGet("{id}/services")]
    public async Task<ActionResult<ApiResponse<List<ServiceResponseDto>>>> GetServices(int id)
    {
        var services = await _db
            .Services.Include(s => s.Category)
            .Include(s => s.Business)
                .ThenInclude(b => b.Provider.User)
            .Where(s => s.Business.ProviderId == id && s.IsActive)
            .Select(s => ToServiceDto(s))
            .ToListAsync();

        return Ok(ApiResponse<List<ServiceResponseDto>>.Ok(services));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ProviderResponseDto ToDto(Provider p) =>
        new(
            p.Id,
            p.UserId,
            p.User?.FullName ?? "",
            p.Title,
            p.Bio,
            p.ProfileImageUrl,
            p.AverageRating,
            p.TotalReviews,
            p.AcceptsOnlineBooking,
            p.Businesses.Select(b => new BusinessSummaryDto(b.Id, b.Name, b.City)).ToList()
        );

    private static ServiceResponseDto ToServiceDto(Service s) =>
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
