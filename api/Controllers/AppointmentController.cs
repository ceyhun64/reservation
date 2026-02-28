using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using api.Common;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;

namespace api.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notify;

    public AppointmentController(AppDbContext db, INotificationService notify)
    {
        _db = db;
        _notify = notify;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET: Kendi randevularım (müşteri)
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResponse<AppointmentResponseDto>>>> GetMine(
        [FromQuery] AppointmentFilterDto filter)
    {
        var userId = GetUserId();

        var query = _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider!.User)
            .Include(a => a.Service!.Category)
            .Include(a => a.Review)
            .Where(a => a.CustomerId == userId)
            .AsQueryable();

        query = ApplyFilters(query, filter);

        return Ok(ApiResponse<PagedResponse<AppointmentResponseDto>>.Ok(
            await ToPaged(query, filter.Page, filter.PageSize)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET: Provider olarak gelen randevular
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("provider")]
    [Authorize(Roles = "Provider,BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<PagedResponse<AppointmentResponseDto>>>> GetAsProvider(
        [FromQuery] AppointmentFilterDto filter)
    {
        var userId = GetUserId();
        var provider = await _db.Providers.FirstOrDefaultAsync(p => p.UserId == userId);
        if (provider is null) return BadRequest(ApiResponse<PagedResponse<AppointmentResponseDto>>.Fail("Provider profili bulunamadı."));

        var query = _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider!.User)
            .Include(a => a.Service!.Category)
            .Include(a => a.Review)
            .Where(a => a.ProviderId == provider.Id)
            .AsQueryable();

        query = ApplyFilters(query, filter);

        return Ok(ApiResponse<PagedResponse<AppointmentResponseDto>>.Ok(
            await ToPaged(query, filter.Page, filter.PageSize)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET: İşletmenin tüm randevuları
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("business/{businessId}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<PagedResponse<AppointmentResponseDto>>>> GetByBusiness(
        int businessId, [FromQuery] AppointmentFilterDto filter)
    {
        var userId = GetUserId();
        var business = await _db.Businesses.FindAsync(businessId);
        if (business is null) return NotFound(ApiResponse<PagedResponse<AppointmentResponseDto>>.Fail("İşletme bulunamadı."));
        if (business.OwnerId != userId && !User.IsInRole("Admin")) return Forbid();

        var query = _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider!.User)
            .Include(a => a.Service!.Category)
            .Include(a => a.Review)
            .Where(a => a.Service.BusinessId == businessId)
            .AsQueryable();

        query = ApplyFilters(query, filter);

        return Ok(ApiResponse<PagedResponse<AppointmentResponseDto>>.Ok(
            await ToPaged(query, filter.Page, filter.PageSize)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  POST: Randevu oluştur
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<ActionResult<ApiResponse<AppointmentResponseDto>>> Create(AppointmentCreateDto dto)
    {
        var customerId = GetUserId();

        // Slot kontrolü
        var slot = await _db.TimeSlots.FindAsync(dto.TimeSlotId);
        if (slot is null || slot.ProviderId != dto.ProviderId)
            return BadRequest(ApiResponse<AppointmentResponseDto>.Fail("Geçersiz zaman slotu."));
        if (slot.Status != SlotStatus.Available)
            return BadRequest(ApiResponse<AppointmentResponseDto>.Fail("Bu slot artık müsait değil."));

        // Servis kontrolü
        var service = await _db.Services.FindAsync(dto.ServiceId);
        if (service is null || !service.IsActive)
            return NotFound(ApiResponse<AppointmentResponseDto>.Fail("Hizmet bulunamadı."));

        // Provider bu hizmeti sunuyor mu?
        var providerService = await _db.ProviderServices
            .FirstOrDefaultAsync(ps => ps.ProviderId == dto.ProviderId && ps.ServiceId == dto.ServiceId && ps.IsActive);
        if (providerService is null)
            return BadRequest(ApiResponse<AppointmentResponseDto>.Fail("Bu provider söz konusu hizmeti sunmuyor."));

        var price = providerService.CustomPrice ?? service.Price;

        var appointment = new Appointment
        {
            CustomerId = customerId,
            ProviderId = dto.ProviderId,
            ServiceId = dto.ServiceId,
            TimeSlotId = dto.TimeSlotId,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            PricePaid = price,
            CustomerNotes = dto.CustomerNotes,
            Status = AppointmentStatus.Pending
        };

        // Slot'u dolu işaretle
        slot.Status = SlotStatus.Booked;

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync();

        // Slot - Appointment ilişkisini güncelle
        slot.AppointmentId = appointment.Id;
        await _db.SaveChangesAsync();

        // Bildirimler
        var provider = await _db.Providers.Include(p => p.User).FirstAsync(p => p.Id == dto.ProviderId);
        await _notify.SendAsync(customerId, "Randevu Alındı",
            $"{service.Name} için randevunuz alındı. Onay bekleniyor.",
            "Info", appointment.Id);
        await _notify.SendAsync(provider.UserId, "Yeni Randevu Talebi",
            $"Yeni bir randevu talebiniz var: {service.Name}",
            "Info", appointment.Id);

        await _db.Entry(appointment).Reference(a => a.Customer).LoadAsync();
        await _db.Entry(appointment).Reference(a => a.Provider).LoadAsync();
        if (appointment.Provider is not null)
            await _db.Entry(appointment.Provider).Reference(p => p.User).LoadAsync();
        await _db.Entry(appointment).Reference(a => a.Service).LoadAsync();
        if (appointment.Service is not null)
            await _db.Entry(appointment.Service).Reference(s => s.Category).LoadAsync();

        return CreatedAtAction(nameof(GetMine), null,
            ApiResponse<AppointmentResponseDto>.Ok(ToDto(appointment), "Randevu talebiniz iletildi."));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PATCH: Durum güncelle (Provider)
    //  Aksiyonlar: confirm | reject | complete | noshow
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Provider,BusinessOwner,Admin")]
    public async Task<ActionResult<ApiResponse<AppointmentResponseDto>>> UpdateStatus(
        int id, AppointmentUpdateStatusDto dto)
    {
        var userId = GetUserId();
        var appt = await LoadAppointment(id);
        if (appt is null) return NotFound(ApiResponse<AppointmentResponseDto>.Fail("Randevu bulunamadı."));

        // Sadece kendi randevusunu yönetebilir
        if (appt.Provider.UserId != userId && !User.IsInRole("Admin")) return Forbid();

        var (newStatus, notifyTitle, notifyMsg) = dto.Action.ToLower() switch
        {
            "confirm" => (AppointmentStatus.Confirmed,
                           "Randevunuz Onaylandı",
                           $"{appt.Service.Name} randevunuz {appt.StartTime:dd.MM.yyyy HH:mm} için onaylandı."),

            "reject" => (AppointmentStatus.Rejected,
                           "Randevunuz Reddedildi",
                           $"{appt.Service.Name} randevunuz reddedildi. Neden: {dto.Reason ?? "-"}"),

            "complete" => (AppointmentStatus.Completed,
                           "Randevunuz Tamamlandı",
                           $"{appt.Service.Name} hizmetiniz tamamlandı. Değerlendirme yapmayı unutmayın!"),

            "noshow" => (AppointmentStatus.NoShow,
                           "Randevu: Gelmedi",
                           $"{appt.StartTime:dd.MM.yyyy HH:mm} tarihli randevunuz 'Gelmedi' olarak işaretlendi."),

            _ => throw new ArgumentException("Geçersiz aksiyon. (confirm/reject/complete/noshow)")
        };

        if (!IsValidTransition(appt.Status, newStatus))
            return BadRequest(ApiResponse<AppointmentResponseDto>.Fail(
                $"'{appt.Status}' durumundan '{newStatus}' durumuna geçiş yapılamaz."));

        appt.Status = newStatus;
        appt.CancellationReason = dto.Reason;

        if (newStatus == AppointmentStatus.Confirmed) appt.ConfirmedAt = DateTime.UtcNow;
        if (newStatus == AppointmentStatus.Completed) appt.CompletedAt = DateTime.UtcNow;
        if (newStatus is AppointmentStatus.Rejected or AppointmentStatus.NoShow)
        {
            appt.CancelledAt = DateTime.UtcNow;
            if (appt.TimeSlot is not null) appt.TimeSlot.Status = SlotStatus.Available; // Slotu serbest bırak
        }

        await _db.SaveChangesAsync();
        await _notify.SendAsync(appt.CustomerId, notifyTitle, notifyMsg,
            newStatus == AppointmentStatus.Confirmed ? "Success" : "Warning", appt.Id);

        return Ok(ApiResponse<AppointmentResponseDto>.Ok(ToDto(appt)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PATCH: İptal et (Müşteri)
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPatch("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<object?>>> Cancel(int id, [FromBody] CancelDto dto)
    {
        var userId = GetUserId();
        var appt = await LoadAppointment(id);
        if (appt is null) return NotFound(ApiResponse<object?>.Fail("Randevu bulunamadı."));
        if (appt.CustomerId != userId) return Forbid();

        if (appt.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            return BadRequest(ApiResponse<object?>.Fail("Bu randevu iptal edilemez."));

        appt.Status = AppointmentStatus.CancelledByCustomer;
        appt.CancellationReason = dto.Reason;
        appt.CancelledAt = DateTime.UtcNow;

        if (appt.TimeSlot is not null)
            appt.TimeSlot.Status = SlotStatus.Available;

        await _db.SaveChangesAsync();
        await _notify.SendAsync(appt.Provider.UserId, "Randevu İptal Edildi",
            $"Müşteri {appt.Customer.FullName} randevuyu iptal etti.",
            "Warning", appt.Id);

        return Ok(ApiResponse<object?>.Ok(null, "Randevu iptal edildi."));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static bool IsValidTransition(AppointmentStatus from, AppointmentStatus to) =>
        (from, to) switch
        {
            (AppointmentStatus.Pending, AppointmentStatus.Confirmed) => true,
            (AppointmentStatus.Pending, AppointmentStatus.Rejected) => true,
            (AppointmentStatus.Confirmed, AppointmentStatus.Completed) => true,
            (AppointmentStatus.Confirmed, AppointmentStatus.NoShow) => true,
            _ => false
        };

    private async Task<Appointment?> LoadAppointment(int id) =>
        await _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider!.User)
            .Include(a => a.Service!.Category)
            .Include(a => a.TimeSlot)
            .Include(a => a.Review)
            .FirstOrDefaultAsync(a => a.Id == id);

    private static IQueryable<Appointment> ApplyFilters(IQueryable<Appointment> q, AppointmentFilterDto f)
    {
        if (!string.IsNullOrWhiteSpace(f.Status) && Enum.TryParse<AppointmentStatus>(f.Status, out var status))
            q = q.Where(a => a.Status == status);
        if (f.From.HasValue) q = q.Where(a => a.StartTime >= f.From);
        if (f.To.HasValue) q = q.Where(a => a.StartTime <= f.To);
        return q.OrderByDescending(a => a.StartTime);
    }

    private static async Task<PagedResponse<AppointmentResponseDto>> ToPaged(
        IQueryable<Appointment> q, int page, int pageSize)
    {
        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).Select(a => ToDto(a)).ToListAsync();
        return new PagedResponse<AppointmentResponseDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    private static AppointmentResponseDto ToDto(Appointment a) =>
        new(a.Id,
            a.CustomerId, a.Customer?.FullName ?? "",
            a.ProviderId, a.Provider?.User?.FullName ?? "",
            a.ServiceId, a.Service?.Name ?? "",
            a.Service?.Category?.Name ?? "",
            a.StartTime, a.EndTime, a.PricePaid,
            a.Status.ToString(),
            a.CustomerNotes, a.ProviderNotes, a.CancellationReason,
            a.Review is not null,
            a.CreatedAt);

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

public record CancelDto(string? Reason);