using System.Security.Claims;
using api.Common;
using api.Data;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _db;

    public NotificationController(AppDbContext db) => _db = db;

    /// <summary>Bildirimleri getir</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAll(
        [FromQuery] bool unreadOnly = false
    )
    {
        var userId = GetUserId();

        var query = _db.Notifications.Where(n => n.UserId == userId).AsQueryable();

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var result = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.AppointmentId,
                n.CreatedAt,
            })
            .ToListAsync();

        var unreadCount = await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        return Ok(
            ApiResponse<List<object>>.Ok(
                result.Cast<object>().ToList(),
                $"{unreadCount} okunmamış bildirim"
            )
        );
    }

    /// <summary>Bildirimi okundu işaretle</summary>
    [HttpPatch("{id}/read")]
    public async Task<ActionResult<ApiResponse<object?>>> MarkRead(int id)
    {
        var userId = GetUserId();
        var notification = await _db.Notifications.FirstOrDefaultAsync(n =>
            n.Id == id && n.UserId == userId
        );
        if (notification is null)
            return NotFound(ApiResponse<object?>.Fail("Bildirim bulunamadı."));

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object?>.Ok(null));
    }

    /// <summary>Tümünü okundu işaretle</summary>
    [HttpPatch("read-all")]
    public async Task<ActionResult<ApiResponse<object?>>> MarkAllRead()
    {
        var userId = GetUserId();
        var unread = await _db
            .Notifications.Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        var now = DateTime.UtcNow;
        unread.ForEach(n =>
        {
            n.IsRead = true;
            n.ReadAt = now;
        });
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object?>.Ok(null, $"{unread.Count} bildirim okundu."));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
