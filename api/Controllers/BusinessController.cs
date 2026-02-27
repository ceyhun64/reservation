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
public class BusinessController : ControllerBase
{
    private readonly AppDbContext _db;

    public BusinessController(AppDbContext db) => _db = db;

    // GET api/business
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Businesses.Include(b => b.Services).ToListAsync());

    // GET api/business/1
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var business = await _db.Businesses
            .Include(b => b.Services)
            .FirstOrDefaultAsync(b => b.Id == id);

        return business is null ? NotFound("İşletme bulunamadı.") : Ok(business);
    }

    // POST api/business
    [HttpPost]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Create(BusinessDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var business = new Business
        {
            Name = dto.Name,
            Description = dto.Description,
            Address = dto.Address,
            Phone = dto.Phone,
            OwnerId = userId
        };

        _db.Businesses.Add(business);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = business.Id }, business);
    }

    // PUT api/business/1
    [HttpPut("{id}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Update(int id, BusinessDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var business = await _db.Businesses.FindAsync(id);

        if (business is null) return NotFound("İşletme bulunamadı.");
        if (business.OwnerId != userId) return Forbid();

        business.Name = dto.Name;
        business.Description = dto.Description;
        business.Address = dto.Address;
        business.Phone = dto.Phone;

        await _db.SaveChangesAsync();
        return Ok(business);
    }

    // DELETE api/business/1
    [HttpDelete("{id}")]
    [Authorize(Roles = "BusinessOwner,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var business = await _db.Businesses.FindAsync(id);

        if (business is null) return NotFound("İşletme bulunamadı.");
        if (business.OwnerId != userId) return Forbid();

        _db.Businesses.Remove(business);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}