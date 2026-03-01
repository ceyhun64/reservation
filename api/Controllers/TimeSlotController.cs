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
[Route("api/timeslots")]
public class TimeSlotController : ControllerBase
{
    private readonly AppDbContext _db;
    public TimeSlotController(AppDbContext db) => _db = db;

    /// <summary>Provider'ın müsait slotlarını getir</summary>
    [HttpGet("provider/{providerId}")]
    public async Task<ActionResult<ApiResponse<List<TimeSlotResponseDto>>>> GetAvailable(
        int providerId,
        [FromQuery] DateTime? date)
    {
        var query = _db.TimeSlots
            .Where(ts => ts.ProviderId == providerId &&
                         ts.Status == SlotStatus.Available &&
                         ts.StartTime > DateTime.UtcNow)
            .AsQueryable();

        if (date.HasValue)
            query = query.Where(ts => ts.StartTime.Date == date.Value.Date);

        var slots = await query
            .OrderBy(ts => ts.StartTime)
            .Select(ts => new TimeSlotResponseDto(
                ts.Id, ts.ProviderId,
                ts.StartTime, ts.EndTime,
                ts.Status.ToString()))
            .ToListAsync();

        return Ok(ApiResponse<List<TimeSlotResponseDto>>.Ok(slots));
    }

    /// <summary>Tekli slot ekle</summary>
    [HttpPost("provider/{providerId}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<TimeSlotResponseDto>>> Create(
        int providerId, TimeSlotCreateDto dto)
    {
        await EnsureOwnerAsync(providerId);

        if (dto.StartTime >= dto.EndTime)
            return BadRequest(ApiResponse<TimeSlotResponseDto>.Fail("Bitiş zamanı başlangıçtan büyük olmalıdır."));

        if (dto.StartTime < DateTime.UtcNow)
            return BadRequest(ApiResponse<TimeSlotResponseDto>.Fail("Geçmiş tarihli slot eklenemez."));

        // Çakışma kontrolü
        var conflict = await _db.TimeSlots.AnyAsync(ts =>
            ts.ProviderId == providerId &&
            ts.Status != SlotStatus.Expired &&
            ts.StartTime < dto.EndTime &&
            ts.EndTime > dto.StartTime);

        if (conflict)
            return BadRequest(ApiResponse<TimeSlotResponseDto>.Fail("Bu zaman diliminde çakışan slot var."));

        var slot = new TimeSlot
        {
            ProviderId = providerId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime
        };

        _db.TimeSlots.Add(slot);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<TimeSlotResponseDto>.Ok(
            new TimeSlotResponseDto(slot.Id, slot.ProviderId, slot.StartTime, slot.EndTime, slot.Status.ToString()),
            "Slot oluşturuldu."));
    }

    /// <summary>Toplu slot oluştur (gün bazlı, örn: 09:00-18:00 arası 30'ar dk)</summary>
    [HttpPost("provider/{providerId}/bulk")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> CreateBulk(
        int providerId, BulkTimeSlotCreateDto dto)
    {
        await EnsureOwnerAsync(providerId);

        var slots = new List<TimeSlot>();
        var slotStart = dto.Date.Date + dto.WorkStart;
        var workEnd = dto.Date.Date + dto.WorkEnd;

        while (slotStart.AddMinutes(dto.SlotMinutes) <= workEnd)
        {
            var slotEnd = slotStart.AddMinutes(dto.SlotMinutes);
            var conflict = await _db.TimeSlots.AnyAsync(ts =>
                ts.ProviderId == providerId &&
                ts.Status != SlotStatus.Expired &&
                ts.StartTime < slotEnd &&
                ts.EndTime > slotStart);

            if (!conflict)
                slots.Add(new TimeSlot
                {
                    ProviderId = providerId,
                    StartTime = DateTime.SpecifyKind(slotStart, DateTimeKind.Utc),
                    EndTime = DateTime.SpecifyKind(slotEnd, DateTimeKind.Utc)
                });

            slotStart = slotEnd;
        }

        _db.TimeSlots.AddRange(slots);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { Created = slots.Count }, $"{slots.Count} slot oluşturuldu."));
    }

    /// <summary>Slotu bloke et (izin, mola vb.)</summary>
    [HttpPatch("{slotId}/block")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Block(int slotId)
    {
        var slot = await _db.TimeSlots.FindAsync(slotId);
        if (slot is null) return NotFound(ApiResponse<object>.Fail("Slot bulunamadı."));
        await EnsureOwnerAsync(slot.ProviderId);

        if (slot.Status == SlotStatus.Booked)
            return BadRequest(ApiResponse<object>.Fail("Dolu slot bloke edilemez."));

        slot.Status = SlotStatus.Blocked;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Slot bloke edildi."));
    }

    /// <summary>Slotu sil (sadece müsait olanlar)</summary>
    [HttpDelete("{slotId}")]
    [Authorize(Roles = "Provider,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int slotId)
    {
        var slot = await _db.TimeSlots.FindAsync(slotId);
        if (slot is null) return NotFound(ApiResponse<object>.Fail("Slot bulunamadı."));
        await EnsureOwnerAsync(slot.ProviderId);

        if (slot.Status == SlotStatus.Booked)
            return BadRequest(ApiResponse<object>.Fail("Dolu slot silinemez."));

        _db.TimeSlots.Remove(slot);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Slot silindi."));
    }

    private async Task EnsureOwnerAsync(int providerId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var provider = await _db.Providers.FindAsync(providerId)
            ?? throw new KeyNotFoundException("Provider bulunamadı.");

        if (provider.UserId != userId && !User.IsInRole("Admin"))
            throw new UnauthorizedAccessException();
    }
}