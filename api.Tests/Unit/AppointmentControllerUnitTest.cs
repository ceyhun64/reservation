using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace api.Tests.Unit;

public class AppointmentControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private AppointmentController CreateController(
        AppDbContext db,
        int userId = 1,
        string role = "Receiver"
    )
    {
        var notify = new Mock<INotificationService>();
        notify
            .Setup(n =>
                n.SendAsync(
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int?>()
                )
            )
            .Returns(Task.CompletedTask);

        var controller = new AppointmentController(db, notify.Object);
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

    private async Task<(int providerId, int serviceId, int slotId)> SeedAsync(AppDbContext db)
    {
        var receiverUser = new User
        {
            Id = 1,
            FullName = "Receiver",
            Email = "r@t.com",
            PasswordHash = "x",
            Phone = "1",
            Role = "Receiver",
        };
        var providerUser = new User
        {
            Id = 2,
            FullName = "Provider",
            Email = "p@t.com",
            PasswordHash = "x",
            Phone = "2",
            Role = "Provider",
        };
        db.Users.AddRange(receiverUser, providerUser);

        var provider = new Provider
        {
            UserId = 2,
            Title = "T",
            Bio = "B",
        };
        db.Providers.Add(provider);

        var category = new Category
        {
            Id = 1,
            Name = "Test",
            Slug = "test",
            Description = "D",
        };
        db.Categories.Add(category);

        var business = new Business
        {
            Name = "B",
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
            Name = "Hizmet",
            Description = "D",
            Price = 100,
            DurationMinutes = 30,
            BusinessId = business.Id,
            CategoryId = 1,
        };
        db.Services.Add(service);

        var slot = new TimeSlot
        {
            ProviderId = provider.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            EndTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            Status = SlotStatus.Available,
        };
        db.TimeSlots.Add(slot);
        await db.SaveChangesAsync();

        return (provider.Id, service.Id, slot.Id);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);
        var controller = CreateController(db, userId: 1, role: "Receiver");

        var result = await controller.Create(
            new AppointmentCreateDto(providerId, serviceId, slotId, "Not")
        );

        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenSlotNotAvailable()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);

        // Slotu dolu yap
        var slot = db.TimeSlots.Find(slotId)!;
        slot.Status = SlotStatus.Booked;
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId: 1);
        var result = await controller.Create(
            new AppointmentCreateDto(providerId, serviceId, slotId, null)
        );

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenInvalidSlot()
    {
        var db = CreateDb();
        var (providerId, serviceId, _) = await SeedAsync(db);
        var controller = CreateController(db, userId: 1);

        var result = await controller.Create(
            new AppointmentCreateDto(providerId, serviceId, 9999, null)
        );

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── GET MINE ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetMine_ShouldReturn200()
    {
        var db = CreateDb();
        var controller = CreateController(db, userId: 1);
        var result = await controller.GetMine(new AppointmentFilterDto(null, null, null));
        Assert.IsType<OkObjectResult>(result);
    }

    // ── CANCEL ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Cancel_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        var controller = CreateController(db, userId: 1);
        var result = await controller.Cancel(9999, new CancelDto(null));
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Cancel_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);

        var creator = CreateController(db, userId: 1);
        await creator.Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        var apptId = db.Appointments.First().Id;

        var other = CreateController(db, userId: 99);
        var result = await other.Cancel(apptId, new CancelDto(null));
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Cancel_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);

        var controller = CreateController(db, userId: 1);
        await controller.Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        var apptId = db.Appointments.First().Id;

        var result = await controller.Cancel(apptId, new CancelDto(null));
        Assert.IsType<OkObjectResult>(result);
    }

    // ── UPDATE STATUS ─────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        var controller = CreateController(db, userId: 2, role: "Provider");
        var result = await controller.UpdateStatus(
            9999,
            new AppointmentUpdateStatusDto("confirm", null)
        );
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdateStatus_ShouldReturn200_WhenConfirm()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);

        var receiver = CreateController(db, userId: 1, role: "Receiver");
        await receiver.Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        var apptId = db.Appointments.First().Id;

        // Provider (userId=2) onayla
        var provider = CreateController(db, userId: 2, role: "Provider");
        var result = await provider.UpdateStatus(
            apptId,
            new AppointmentUpdateStatusDto("confirm", null)
        );
        Assert.IsType<OkObjectResult>(result);
    }
}
