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
[Route("api/reviews")]
public class ReviewController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReviewController(AppDbContext db) => _db = db;

    /// <summary>Provider'ın değerlendirmeleri</summary>
    [HttpGet("provider/{providerId}")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ReviewResponseDto>>>> GetByProvider(
        int providerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _db.Reviews
            .Include(r => r.Author)
            .Include(r => r.Provider!.User)
            .Where(r => r.ProviderId == providerId && r.IsVisible)
            .OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => ToDto(r)).ToListAsync();

        return Ok(ApiResponse<PagedResponse<ReviewResponseDto>>.Ok(new PagedResponse<ReviewResponseDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        }));
    }

    /// <summary>Randevuya değerlendirme yaz (müşteri)</summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ReviewResponseDto>>> Create(ReviewCreateDto dto)
    {
        var userId = GetUserId();

        var appt = await _db.Appointments
            .Include(a => a.Review)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

        if (appt is null) return NotFound(ApiResponse<ReviewResponseDto>.Fail("Randevu bulunamadı."));
        if (appt.CustomerId != userId) return Forbid();
        if (appt.Status != AppointmentStatus.Completed)
            return BadRequest(ApiResponse<ReviewResponseDto>.Fail("Sadece tamamlanan randevular değerlendirilebilir."));
        if (appt.Review is not null)
            return BadRequest(ApiResponse<ReviewResponseDto>.Fail("Bu randevu için zaten değerlendirme yapılmış."));

        var review = new Review
        {
            AuthorId = userId,
            ProviderId = appt.ProviderId,
            AppointmentId = dto.AppointmentId,
            Rating = dto.Rating,
            Comment = dto.Comment
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        // Provider'ın ortalama puanını güncelle
        await UpdateProviderRating(appt.ProviderId);

        await _db.Entry(review).Reference(r => r.Author).LoadAsync();
        await _db.Entry(review).Reference(r => r.Provider).LoadAsync();
        if (review.Provider is not null)
            await _db.Entry(review.Provider).Reference(p => p.User).LoadAsync();

        return Ok(ApiResponse<ReviewResponseDto>.Ok(ToDto(review), "Değerlendirmeniz alındı."));
    }

    /// <summary>Provider cevap yazar</summary>
    [HttpPatch("{id}/reply")]
    [Authorize(Roles = "Provider,BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<ReviewResponseDto>>> Reply(int id, ReviewReplyDto dto)
    {
        var userId = GetUserId();
        var review = await _db.Reviews
            .Include(r => r.Author)
            .Include(r => r.Provider!.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review is null) return NotFound(ApiResponse<ReviewResponseDto>.Fail("Değerlendirme bulunamadı."));
        if (review.Provider.UserId != userId && !User.IsInRole("Admin")) return Forbid();

        review.ProviderReply = dto.Reply;
        review.ProviderRepliedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<ReviewResponseDto>.Ok(ToDto(review)));
    }

    /// <summary>Değerlendirme gizle (Admin moderasyon)</summary>
    [HttpPatch("{id}/hide")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Hide(int id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review is null) return NotFound(ApiResponse<object>.Fail("Değerlendirme bulunamadı."));

        review.IsVisible = false;
        await _db.SaveChangesAsync();
        await UpdateProviderRating(review.ProviderId);

        return Ok(ApiResponse<object>.Ok(null, "Değerlendirme gizlendi."));
    }

    private async Task UpdateProviderRating(int providerId)
    {
        var provider = await _db.Providers.FindAsync(providerId);
        if (provider is null) return;

        var reviews = await _db.Reviews
            .Where(r => r.ProviderId == providerId && r.IsVisible)
            .ToListAsync();

        provider.TotalReviews = reviews.Count;
        provider.AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        await _db.SaveChangesAsync();
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ReviewResponseDto ToDto(Review r) =>
        new(r.Id, r.Author?.FullName ?? "", r.ProviderId, r.Provider?.User?.FullName ?? "",
            r.AppointmentId, r.Rating, r.Comment, r.ProviderReply, r.CreatedAt);
}