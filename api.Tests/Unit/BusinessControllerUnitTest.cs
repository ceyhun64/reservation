using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Tests.Unit;

public class BusinessControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private BusinessController CreateController(
        AppDbContext db,
        int userId = 1,
        string role = "Provider"
    )
    {
        var controller = new BusinessController(db);
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
            FullName = "Test",
            Email = $"u{userId}@t.com",
            PasswordHash = "x",
            Phone = "123",
            Role = "Provider",
        };
        db.Users.Add(user);
        var provider = new Provider
        {
            UserId = userId,
            Title = "T",
            Bio = "B",
            AcceptsOnlineBooking = true,
        };
        db.Providers.Add(provider);
        await db.SaveChangesAsync();
        return provider.Id;
    }

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    // ── GET ALL ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ShouldReturn200_WithEmptyList()
    {
        var db = CreateDb();
        var result = await CreateController(db).GetAll(null, null, 1, 10);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    // ── GET BY ID ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        var result = await CreateController(db).GetById(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var controller = CreateController(db, userId: 1);
        await controller.Create(
            new BusinessDto("Test", "Desc", "Addr", "İstanbul", "5001234567", null, null)
        );
        var id = db.Businesses.First().Id;
        var result = await controller.GetById(id);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var result = await CreateController(db, userId: 1)
            .Create(
                new BusinessDto(
                    "Test İşletme",
                    "Açıklama",
                    "Adres",
                    "İstanbul",
                    "5001234567",
                    null,
                    null
                )
            );
        Assert.IsType<CreatedAtActionResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldSaveToDatabase()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        await CreateController(db, userId: 1)
            .Create(
                new BusinessDto(
                    "Test İşletme",
                    "Açıklama",
                    "Adres",
                    "İstanbul",
                    "5001234567",
                    null,
                    null
                )
            );
        Assert.Equal(1, db.Businesses.Count());
        Assert.Equal("Test İşletme", db.Businesses.First().Name);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenNoProviderProfile()
    {
        var db = CreateDb();
        var result = await CreateController(db, userId: 99)
            .Create(new BusinessDto("Test", "Desc", "Addr", "İstanbul", "5001234567", null, null));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var controller = CreateController(db, userId: 1);
        await controller.Create(
            new BusinessDto("Eski", "Desc", "Addr", "İstanbul", "123", null, null)
        );
        var id = db.Businesses.First().Id;
        var result = await controller.Update(
            id,
            new BusinessDto("Yeni", "Desc", "Addr", "İstanbul", "123", null, null)
        );
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.Equal("Yeni", db.Businesses.First().Name);
    }

    [Fact]
    public async Task Update_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var result = await CreateController(db, userId: 1)
            .Update(9999, new BusinessDto("Yeni", "Desc", "Addr", "İstanbul", "123", null, null));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Update_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        await SeedProviderAsync(db, 2);
        var owner = CreateController(db, userId: 1);
        await owner.Create(new BusinessDto("Test", "Desc", "Addr", "İstanbul", "123", null, null));
        var id = db.Businesses.First().Id;
        var result = await CreateController(db, userId: 2)
            .Update(id, new BusinessDto("Hack", "Desc", "Addr", "İstanbul", "123", null, null));
        Assert.IsType<ForbidResult>(Unwrap(result));
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var controller = CreateController(db, userId: 1);
        await controller.Create(
            new BusinessDto("Test", "Desc", "Addr", "İstanbul", "123", null, null)
        );
        var id = db.Businesses.First().Id;
        var result = await controller.Delete(id);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var result = await CreateController(db, userId: 1).Delete(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Delete_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        await SeedProviderAsync(db, 2);
        var owner = CreateController(db, userId: 1);
        await owner.Create(new BusinessDto("Test", "Desc", "Addr", "İstanbul", "123", null, null));
        var id = db.Businesses.First().Id;
        var result = await CreateController(db, userId: 2).Delete(id);
        Assert.IsType<ForbidResult>(Unwrap(result));
    }
}
