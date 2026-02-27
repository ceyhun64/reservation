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
public class ServiceController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServiceController(AppDbContext db) => _db = db;

    // GET api/service
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Services.Include(s => s.Business).ToListAsync());

    // GET api/service/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var service = await _db.Services
            .Include(s => s.Business)
            .FirstOrDefaultAsync(s => s.Id == id);

        return service is null ? NotFound("Hizmet bulunamadı.") : Ok(service);
    }

    // GET api/service/business/1
    [HttpGet("business/{businessId}")]
    public async Task<IActionResult> GetByBusiness(int businessId) =>
        Ok(await _db.Services.Where(s => s.BusinessId == businessId).ToListAsync());

    // POST api/service
    [HttpPost]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Create(ServiceDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var business = await _db.Businesses.FindAsync(dto.BusinessId);
        if (business is null) return NotFound("İşletme bulunamadı.");
        if (business.OwnerId != userId) return Forbid();

        var service = new Service
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            DurationMinutes = dto.DurationMinutes,
            BusinessId = dto.BusinessId
        };

        _db.Services.Add(service);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);
    }

    // PUT api/service/1
    [HttpPut("{id}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Update(int id, ServiceDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _db.Services.Include(s => s.Business).FirstOrDefaultAsync(s => s.Id == id);

        if (service is null) return NotFound("Hizmet bulunamadı.");
        if (service.Business.OwnerId != userId) return Forbid();

        service.Name = dto.Name;
        service.Description = dto.Description;
        service.Price = dto.Price;
        service.DurationMinutes = dto.DurationMinutes;

        await _db.SaveChangesAsync();
        return Ok(service);
    }

    // DELETE api/service/1
    [HttpDelete("{id}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _db.Services.Include(s => s.Business).FirstOrDefaultAsync(s => s.Id == id);

        if (service is null) return NotFound("Hizmet bulunamadı.");
        if (service.Business.OwnerId != userId) return Forbid();

        _db.Services.Remove(service);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}