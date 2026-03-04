using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Tests.Unit;

public class ServiceControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private ServiceController CreateController(AppDbContext db, int userId = 1)
    {
        var controller = new ServiceController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                            new Claim(ClaimTypes.Role, "Provider"),
                        },
                        "test"
                    )
                ),
            },
        };
        return controller;
    }

    private async Task<(int businessId, int serviceId)> SeedAsync(AppDbContext db, int userId = 1)
    {
        var user = new User
        {
            Id = userId,
            FullName = "T",
            Email = $"u{userId}@t.com",
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

        var category = new Category
        {
            Id = 100,
            Name = "Test",
            Slug = $"test-{userId}",
            Description = "D",
        };
        db.Categories.Add(category);

        var business = new Business
        {
            Name = "Test",
            Description = "D",
            Address = "A",
            City = "C",
            Phone = "1",
            ProviderId = provider.Id,
        };
        db.Businesses.Add(business);
        await db.SaveChangesAsync();

        var service = new Service
        {
            Name = "Test Hizmet",
            Description = "D",
            Price = 100,
            DurationMinutes = 30,
            BusinessId = business.Id,
            CategoryId = 100,
        };
        db.Services.Add(service);
        await db.SaveChangesAsync();

        return (business.Id, service.Id);
    }

    // ── GET ALL ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ShouldReturn200()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        var result = await controller.GetAll(null, null, null, null);
        Assert.IsType<OkObjectResult>(result);
    }

    // ── GET BY ID ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var db = CreateDb();
        var (_, serviceId) = await SeedAsync(db);
        var controller = CreateController(db);
        var result = await controller.GetById(serviceId);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        var result = await controller.GetById(9999);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenOwner()
    {
        var db = CreateDb();
        var (businessId, _) = await SeedAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var result = await controller.Create(new ServiceDto("Yeni", "D", 100, 30, 100, businessId));
        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenBusinessNotExists()
    {
        var db = CreateDb();
        await SeedAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var result = await controller.Create(new ServiceDto("H", "D", 100, 30, 100, 9999));
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateDb();
        var (businessId, _) = await SeedAsync(db, userId: 1);

        // userId 2 için ayrı provider seed et
        var user2 = new User
        {
            Id = 2,
            FullName = "T2",
            Email = "u2@t.com",
            PasswordHash = "x",
            Phone = "2",
            Role = "Provider",
        };
        db.Users.Add(user2);
        var p2 = new Provider
        {
            UserId = 2,
            Title = "T",
            Bio = "B",
        };
        db.Providers.Add(p2);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId: 2);
        var result = await controller.Create(new ServiceDto("H", "D", 100, 30, 100, businessId));
        Assert.IsType<ForbidResult>(result);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        var (businessId, serviceId) = await SeedAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var result = await controller.Update(
            serviceId,
            new ServiceDto("Güncel", "D", 200, 60, 100, businessId)
        );
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        await SeedAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var result = await controller.Update(9999, new ServiceDto("Güncel", "D", 200, 60, 100, 1));
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        var (_, serviceId) = await SeedAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var result = await controller.Delete(serviceId);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        await SeedAsync(db, userId: 1);
        var controller = CreateController(db, userId: 1);
        var result = await controller.Delete(9999);
        Assert.IsType<NotFoundObjectResult>(result);
    }
}
