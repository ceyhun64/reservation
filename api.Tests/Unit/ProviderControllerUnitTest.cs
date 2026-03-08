using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Tests.Unit;

public class ProviderControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private ProviderController CreateController(
        AppDbContext db,
        int userId = 1,
        string role = "Provider"
    )
    {
        var controller = new ProviderController(db);
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

    private async Task<(int userId, int providerId)> SeedProviderAsync(
        AppDbContext db,
        int userId = 1
    )
    {
        var user = new User
        {
            Id = userId,
            FullName = $"Provider {userId}",
            Email = $"p{userId}@t.com",
            PasswordHash = "x",
            Phone = $"100{userId}",
            Role = "Provider",
        };
        db.Users.Add(user);
        var provider = new Provider
        {
            UserId = userId,
            Title = "Uzman",
            Bio = "Test bio",
            AcceptsOnlineBooking = true,
        };
        db.Providers.Add(provider);
        await db.SaveChangesAsync();
        return (userId, provider.Id);
    }

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    [Fact]
    public async Task Search_ShouldReturn200_WithEmptyList()
    {
        var result = await CreateController(CreateDb())
            .Search(new ProviderSearchDto(null, null, null, null, null, 1, 10));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Search_ShouldReturn200_WithResults()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, 1);
        var result = await CreateController(db)
            .Search(new ProviderSearchDto(null, null, null, null, null, 1, 10));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var db = CreateDb();
        var (_, providerId) = await SeedProviderAsync(db);
        var result = await CreateController(db).GetById(providerId);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb()).GetById(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetMe_ShouldReturn200_WhenProfileExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 1).GetMe();
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetMe_ShouldReturn404_WhenNoProfile()
    {
        var result = await CreateController(CreateDb(), userId: 99).GetMe();
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var db = CreateDb();
        var user = new User
        {
            Id = 1,
            FullName = "Test",
            Email = "t@t.com",
            PasswordHash = "x",
            Phone = "1",
            Role = "Provider",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var result = await CreateController(db, userId: 1)
            .Create(new ProviderDto("Uzman", "Bio", true));
        Assert.IsType<CreatedAtActionResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenProfileAlreadyExists()
    {
        var db = CreateDb();
        await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 1)
            .Create(new ProviderDto("Uzman", "Bio", true));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        var (_, providerId) = await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 1)
            .Update(providerId, new ProviderDto("Yeni Başlık", "Yeni Bio", false));
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.Equal("Yeni Başlık", db.Providers.Find(providerId)!.Title);
    }

    [Fact]
    public async Task Update_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb(), userId: 1)
            .Update(9999, new ProviderDto("X", "Y", true));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Update_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateDb();
        var (_, providerId) = await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db, userId: 99)
            .Update(providerId, new ProviderDto("Hack", "Bio", true));
        Assert.IsType<ForbidResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetServices_ShouldReturn200_WithEmptyList()
    {
        var db = CreateDb();
        var (_, providerId) = await SeedProviderAsync(db, userId: 1);
        var result = await CreateController(db).GetServices(providerId);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }
}
