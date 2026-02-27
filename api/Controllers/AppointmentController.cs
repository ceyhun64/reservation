using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentController(AppDbContext db) => _db = db;

    // GET api/appointment — kullanıcının kendi randevuları
    [HttpGet]
    public async Task<IActionResult> GetMyAppointments()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var appointments = await _db.Appointments
            .Include(a => a.Service)
            .ThenInclude(s => s.Business)
            .Where(a => a.UserId == userId)
            .ToListAsync();

        return Ok(appointments);
    }

    // GET api/appointment/business/1 — işletmenin tüm randevuları
    [HttpGet("business/{businessId}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> GetByBusiness(int businessId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var business = await _db.Businesses.FindAsync(businessId);
        if (business is null) return NotFound("İşletme bulunamadı.");
        if (business.OwnerId != userId) return Forbid();

        var appointments = await _db.Appointments
            .Include(a => a.User)
            .Include(a => a.Service)
            .Where(a => a.Service.BusinessId == businessId)
            .ToListAsync();

        return Ok(appointments);
    }

    // POST api/appointment — randevu oluştur
    [HttpPost]
    public async Task<IActionResult> Create(AppointmentDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var service = await _db.Services.FindAsync(dto.ServiceId);
        if (service is null) return NotFound("Hizmet bulunamadı.");

        var endTime = dto.StartTime.AddMinutes(service.DurationMinutes);

        // Çakışma kontrolü
        var conflict = await _db.Appointments.AnyAsync(a =>
            a.ServiceId == dto.ServiceId &&
            a.Status != "Cancelled" &&
            a.StartTime < endTime &&
            a.EndTime > dto.StartTime);

        if (conflict) return BadRequest("Bu saat diliminde başka bir randevu mevcut.");

        var appointment = new Appointment
        {
            UserId = userId,
            ServiceId = dto.ServiceId,
            StartTime = dto.StartTime,
            EndTime = endTime,
            Notes = dto.Notes,
            Status = "Pending"
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyAppointments), new { id = appointment.Id }, appointment);
    }

    // PUT api/appointment/1/cancel — randevu iptal
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var appointment = await _db.Appointments.FindAsync(id);
        if (appointment is null) return NotFound("Randevu bulunamadı.");
        if (appointment.UserId != userId) return Forbid();

        appointment.Status = "Cancelled";
        await _db.SaveChangesAsync();

        return Ok(new { message = "Randevu iptal edildi." });
    }

    // PUT api/appointment/1/confirm — randevu onayla (işletme sahibi)
    [HttpPut("{id}/confirm")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Confirm(int id)
    {
        var appointment = await _db.Appointments.FindAsync(id);
        if (appointment is null) return NotFound("Randevu bulunamadı.");

        appointment.Status = "Confirmed";
        await _db.SaveChangesAsync();

        return Ok(new { message = "Randevu onaylandı." });
    }
}