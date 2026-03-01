//api.Tests/Unit/BusinessControllerUnitTests.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;

namespace api.Tests.Unit;

public class BusinessControllerUnitTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private BusinessController CreateController(AppDbContext db, int userId = 1, string role = "Provider")
    {
        var controller = new BusinessController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Role, role)
                }, "test"))
            }
        };
        return controller;
    }

    // ──────────────── GET ALL ────────────────

    [Fact]
    public async Task GetAll_ShouldReturn200_WithEmptyList()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db);

        var result = await controller.GetAll();

        Assert.IsType<OkObjectResult>(result);
    }

    // ──────────────── GET BY ID ────────────────

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db);

        await controller.Create(new BusinessDto
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        var result = await controller.GetById(1);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db);

        var result = await controller.GetById(9999);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ──────────────── CREATE ────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        var result = await controller.Create(new BusinessDto
        {
            Name = "Test İşletme",
            Description = "Açıklama",
            Address = "Adres",
            Phone = "05001234567"
        });

        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Create_ShouldSaveToDatabase()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        await controller.Create(new BusinessDto
        {
            Name = "Test İşletme",
            Description = "Açıklama",
            Address = "Adres",
            Phone = "05001234567"
        });

        Assert.Equal(1, db.Businesses.Count());
        Assert.Equal("Test İşletme", db.Businesses.First().Name);
    }

    [Fact]
    public async Task Create_ShouldSetOwnerIdFromToken()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 42);

        await controller.Create(new BusinessDto
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        Assert.Equal(42, db.Businesses.First().OwnerId);
    }

    // ──────────────── UPDATE ────────────────

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        await controller.Create(new BusinessDto
        {
            Name = "Eski",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        var result = await controller.Update(1, new BusinessDto
        {
            Name = "Yeni",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Yeni", db.Businesses.First().Name);
    }

    [Fact]
    public async Task Update_ShouldReturn404_WhenNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        var result = await controller.Update(9999, new BusinessDto
        {
            Name = "Yeni",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Update_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateInMemoryDb();
        var owner = CreateController(db, userId: 1);
        await owner.Create(new BusinessDto
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        var otherUser = CreateController(db, userId: 99);
        var result = await otherUser.Update(1, new BusinessDto
        {
            Name = "Hack",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        Assert.IsType<ForbidResult>(result);
    }

    // ──────────────── DELETE ────────────────

    [Fact]
    public async Task Delete_ShouldReturn204_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        await controller.Create(new BusinessDto
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        var result = await controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, db.Businesses.Count());
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        var result = await controller.Delete(9999);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateInMemoryDb();
        var owner = CreateController(db, userId: 1);
        await owner.Create(new BusinessDto
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123"
        });

        var otherUser = CreateController(db, userId: 99);
        var result = await otherUser.Delete(1);

        Assert.IsType<ForbidResult>(result);
    }
}