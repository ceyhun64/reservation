using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Tests.Unit;

public class TimeSlotControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private TimeSlotController CreateController(
        AppDbContext db,
        int userId = 1,
        string role = "Provider"
    )
    {
        var controller = new TimeSlotController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                            new Claim(ClaimTypes.Role, role),
                        },
                        "test"
                    )
                ),
            },
        };
        return controller;
    }

    private async Task<int> SeedProviderAsync(AppDbContext db, int userId = 1)
    {
        var user = new User
        {
            Id = userId,
            FullName = "Provider",
            Email = $"p{userId}@t.com",
            PasswordHash = "x",
            Phone = "1",
            Role = "Provider",
        };
        db.Users.Add(user);
        var provider = new Provider
        {
            UserId = userId,
            Title = "T",
            Bio = "B",
        };
        db.Providers.Add(provider);
        await db.SaveChangesAsync();
        return provider.Id;
    }

    private async Task<int> SeedSlotAsync(
        AppDbContext db,
        int providerId,
        SlotStatus status = SlotStatus.Available
    )
    {
        var slot = new TimeSlot
        {
            ProviderId = providerId,
            StartTime = DateTime.UtcNow.AddDays(1),
            EndTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            Status = status,
        };
        db.TimeSlots.Add(slot);
        await db.SaveChangesAsync();
        return slot.Id;
    }

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    // ── GET AVAILABLE ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailable_ShouldReturn200_WithEmptyList()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db);
        var result = await CreateController(db).GetAvailable(providerId, null);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetAvailable_ShouldReturn200_WithSlots()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db);
        await SeedSlotAsync(db, providerId);
        var result = await CreateController(db).GetAvailable(providerId, null);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetAvailable_ShouldNotReturnBookedSlots()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db);
        await SeedSlotAsync(db, providerId, SlotStatus.Booked);
        var result = await CreateController(db).GetAvailable(providerId, null);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn200_WhenValidData()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var start = DateTime.UtcNow.AddDays(2);
        var result = await CreateController(db, userId: 1)
            .Create(providerId, new TimeSlotCreateDto(start, start.AddHours(1)));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenEndBeforeStart()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var start = DateTime.UtcNow.AddDays(2);
        var result = await CreateController(db, userId: 1)
            .Create(providerId, new TimeSlotCreateDto(start, start.AddHours(-1)));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenPastDate()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var past = DateTime.UtcNow.AddDays(-1);
        var result = await CreateController(db, userId: 1)
            .Create(providerId, new TimeSlotCreateDto(past, past.AddHours(1)));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenConflictingSlot()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var start = DateTime.UtcNow.AddDays(3);
        await controller.Create(providerId, new TimeSlotCreateDto(start, start.AddHours(1)));
        var result = await controller.Create(
            providerId,
            new TimeSlotCreateDto(start.AddMinutes(30), start.AddMinutes(90))
        );
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    // ── CREATE BULK ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBulk_ShouldReturn200_WhenValidData()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 1)
            .CreateBulk(
                providerId,
                new BulkTimeSlotCreateDto(
                    DateTime.UtcNow.AddDays(5).Date,
                    new TimeSpan(9, 0, 0),
                    new TimeSpan(12, 0, 0),
                    60
                )
            );
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    // ── BLOCK ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Block_ShouldReturn200_WhenAvailableSlot()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var slotId = await SeedSlotAsync(db, providerId);
        var result = await CreateController(db, userId: 1).Block(slotId);
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.Equal(SlotStatus.Blocked, db.TimeSlots.Find(slotId)!.Status);
    }

    [Fact]
    public async Task Block_ShouldReturn400_WhenBookedSlot()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var slotId = await SeedSlotAsync(db, providerId, SlotStatus.Booked);
        var result = await CreateController(db, userId: 1).Block(slotId);
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Block_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 1).Block(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ShouldReturn200_WhenAvailableSlot()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var slotId = await SeedSlotAsync(db, providerId);
        var result = await CreateController(db, userId: 1).Delete(slotId);
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.Null(db.TimeSlots.Find(slotId));
    }

    [Fact]
    public async Task Delete_ShouldReturn400_WhenBookedSlot()
    {
        var db = CreateDb();
        var providerId = await SeedProviderAsync(db, userId: 1);
        var slotId = await SeedSlotAsync(db, providerId, SlotStatus.Booked);
        var result = await CreateController(db, userId: 1).Delete(slotId);
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 1).Delete(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }
}
