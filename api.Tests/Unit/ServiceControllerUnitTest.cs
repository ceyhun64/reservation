//api.Tests/Unit/ServiceControllerUnitTests.cs
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
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

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

    private async Task<int> CreateBusinessAndService(AppDbContext db, int ownerId = 1)
    {
        var business = new Business
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123",
            OwnerId = ownerId,
        };
        db.Businesses.Add(business);
        await db.SaveChangesAsync();

        var service = new Service
        {
            Name = "Test Hizmet",
            Description = "Desc",
            Price = 100,
            DurationMinutes = 30,
            BusinessId = business.Id,
        };
        db.Services.Add(service);
        await db.SaveChangesAsync();

        return service.Id;
    }

    // ──────────────── GET ALL ────────────────

    [Fact]
    public async Task GetAll_ShouldReturn200()
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
        var serviceId = await CreateBusinessAndService(db);
        var controller = CreateController(db);

        var result = await controller.GetById(serviceId);
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

    // ──────────────── GET BY BUSINESS ────────────────

    [Fact]
    public async Task GetByBusiness_ShouldReturn200()
    {
        var db = CreateInMemoryDb();
        await CreateBusinessAndService(db);
        var controller = CreateController(db);

        var result = await controller.GetByBusiness(1);
        Assert.IsType<OkObjectResult>(result);
    }

    // ──────────────── CREATE ────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var business = new Business
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123",
            OwnerId = 1,
        };
        db.Businesses.Add(business);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId: 1);
        var result = await controller.Create(
            new ServiceDto
            {
                Name = "Hizmet",
                Description = "Desc",
                Price = 100,
                DurationMinutes = 30,
                BusinessId = business.Id,
            }
        );

        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenBusinessNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        var result = await controller.Create(
            new ServiceDto
            {
                Name = "Hizmet",
                Description = "Desc",
                Price = 100,
                DurationMinutes = 30,
                BusinessId = 9999,
            }
        );

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateInMemoryDb();
        var business = new Business
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123",
            OwnerId = 1,
        };
        db.Businesses.Add(business);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId: 99);
        var result = await controller.Create(
            new ServiceDto
            {
                Name = "Hizmet",
                Description = "Desc",
                Price = 100,
                DurationMinutes = 30,
                BusinessId = business.Id,
            }
        );

        Assert.IsType<ForbidResult>(result);
    }

    // ──────────────── UPDATE ────────────────

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var serviceId = await CreateBusinessAndService(db, ownerId: 1);
        var controller = CreateController(db, userId: 1);

        var result = await controller.Update(
            serviceId,
            new ServiceDto
            {
                Name = "Güncel",
                Description = "Desc",
                Price = 200,
                DurationMinutes = 60,
                BusinessId = 1,
            }
        );

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ShouldReturn404_WhenNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        var result = await controller.Update(
            9999,
            new ServiceDto
            {
                Name = "Güncel",
                Description = "Desc",
                Price = 200,
                DurationMinutes = 60,
                BusinessId = 1,
            }
        );

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Update_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateInMemoryDb();
        var serviceId = await CreateBusinessAndService(db, ownerId: 1);
        var controller = CreateController(db, userId: 99);

        var result = await controller.Update(
            serviceId,
            new ServiceDto
            {
                Name = "Hack",
                Description = "Desc",
                Price = 200,
                DurationMinutes = 60,
                BusinessId = 1,
            }
        );

        Assert.IsType<ForbidResult>(result);
    }

    // ──────────────── DELETE ────────────────

    [Fact]
    public async Task Delete_ShouldReturn204_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var serviceId = await CreateBusinessAndService(db, ownerId: 1);
        var controller = CreateController(db, userId: 1);

        var result = await controller.Delete(serviceId);
        Assert.IsType<NoContentResult>(result);
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
        var serviceId = await CreateBusinessAndService(db, ownerId: 1);
        var controller = CreateController(db, userId: 99);

        var result = await controller.Delete(serviceId);
        Assert.IsType<ForbidResult>(result);
    }
}
