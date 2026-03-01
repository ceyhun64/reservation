//api.Tests/Unit/AppointmentControllerUnitTests.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;

namespace api.Tests.Unit;

public class AppointmentControllerUnitTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private AppointmentController CreateController(AppDbContext db, int userId = 1, string role = "Receiver")
    {
        var controller = new AppointmentController(db);
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

    private async Task<(int businessId, int serviceId)> CreateBusinessAndService(AppDbContext db, int ownerId = 1)
    {
        var business = new Business
        {
            Name = "Test",
            Description = "Desc",
            Address = "Addr",
            Phone = "123",
            OwnerId = ownerId
        };
        db.Businesses.Add(business);
        await db.SaveChangesAsync();

        var service = new Service
        {
            Name = "Hizmet",
            Description = "Desc",
            Price = 100,
            DurationMinutes = 30,
            BusinessId = business.Id
        };
        db.Services.Add(service);
        await db.SaveChangesAsync();

        return (business.Id, service.Id);
    }

    // ──────────────── CREATE ────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);
        var controller = CreateController(db, userId: 1);

        var result = await controller.Create(new AppointmentDto
        {
            ServiceId = serviceId,
            StartTime = DateTime.UtcNow.AddDays(1),
            Notes = "Test"
        });

        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenServiceNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);

        var result = await controller.Create(new AppointmentDto
        {
            ServiceId = 9999,
            StartTime = DateTime.UtcNow.AddDays(1),
            Notes = ""
        });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenTimeConflict()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);
        var controller = CreateController(db, userId: 1);
        var startTime = DateTime.UtcNow.AddDays(1);

        await controller.Create(new AppointmentDto
        {
            ServiceId = serviceId,
            StartTime = startTime,
            Notes = "İlk"
        });

        var result = await controller.Create(new AppointmentDto
        {
            ServiceId = serviceId,
            StartTime = startTime,
            Notes = "Çakışan"
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShouldSetCorrectEndTime()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);
        var controller = CreateController(db, userId: 1);
        var startTime = DateTime.UtcNow.AddDays(1);

        await controller.Create(new AppointmentDto
        {
            ServiceId = serviceId,
            StartTime = startTime,
            Notes = ""
        });

        var appointment = db.Appointments.First();
        Assert.Equal(startTime.AddMinutes(30), appointment.EndTime);
    }

    // ──────────────── GET MY APPOINTMENTS ────────────────

    [Fact]
    public async Task GetMyAppointments_ShouldReturn200()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);
        var result = await controller.GetMyAppointments();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMyAppointments_ShouldReturnOnlyMyAppointments()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);

        var user1 = CreateController(db, userId: 1);
        var user2 = CreateController(db, userId: 2);

        await user1.Create(new AppointmentDto { ServiceId = serviceId, StartTime = DateTime.UtcNow.AddDays(1) });
        await user2.Create(new AppointmentDto { ServiceId = serviceId, StartTime = DateTime.UtcNow.AddDays(2) });

        var result = await user1.GetMyAppointments();
        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<Appointment>>(ok.Value);
        Assert.Single(list);
    }

    // ──────────────── CANCEL ────────────────

    [Fact]
    public async Task Cancel_ShouldReturn200_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);
        var controller = CreateController(db, userId: 1);

        await controller.Create(new AppointmentDto { ServiceId = serviceId, StartTime = DateTime.UtcNow.AddDays(1) });
        var appointmentId = db.Appointments.First().Id;

        var result = await controller.Cancel(appointmentId);
        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Cancelled", db.Appointments.First().Status);
    }

    [Fact]
    public async Task Cancel_ShouldReturn404_WhenNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1);
        var result = await controller.Cancel(9999);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Cancel_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);
        var user1 = CreateController(db, userId: 1);
        await user1.Create(new AppointmentDto { ServiceId = serviceId, StartTime = DateTime.UtcNow.AddDays(1) });
        var appointmentId = db.Appointments.First().Id;

        var user2 = CreateController(db, userId: 99);
        var result = await user2.Cancel(appointmentId);
        Assert.IsType<ForbidResult>(result);
    }

    // ──────────────── CONFIRM ────────────────

    [Fact]
    public async Task Confirm_ShouldReturn200_WhenExists()
    {
        var db = CreateInMemoryDb();
        var (_, serviceId) = await CreateBusinessAndService(db);
        var receiver = CreateController(db, userId: 1);
        await receiver.Create(new AppointmentDto { ServiceId = serviceId, StartTime = DateTime.UtcNow.AddDays(1) });
        var appointmentId = db.Appointments.First().Id;

        var owner = CreateController(db, userId: 1, role: "BusinessOwner");
        var result = await owner.Confirm(appointmentId);
        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Confirmed", db.Appointments.First().Status);
    }

    [Fact]
    public async Task Confirm_ShouldReturn404_WhenNotExists()
    {
        var db = CreateInMemoryDb();
        var controller = CreateController(db, userId: 1, role: "BusinessOwner");
        var result = await controller.Confirm(9999);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ──────────────── GET BY BUSINESS ────────────────

    [Fact]
    public async Task GetByBusiness_ShouldReturn200_WhenOwner()
    {
        var db = CreateInMemoryDb();
        var (businessId, serviceId) = await CreateBusinessAndService(db, ownerId: 1);
        var receiver = CreateController(db, userId: 2);
        await receiver.Create(new AppointmentDto { ServiceId = serviceId, StartTime = DateTime.UtcNow.AddDays(1) });

        var owner = CreateController(db, userId: 1, role: "BusinessOwner");
        var result = await owner.GetByBusiness(businessId);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByBusiness_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateInMemoryDb();
        var (businessId, _) = await CreateBusinessAndService(db, ownerId: 1);

        var otherUser = CreateController(db, userId: 99, role: "BusinessOwner");
        var result = await otherUser.GetByBusiness(businessId);
        Assert.IsType<ForbidResult>(result);
    }
}