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
        var notifyMock = new Mock<INotificationService>();
        notifyMock
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
        notifyMock
            .Setup(n =>
                n.SendAppointmentStatusChangedAsync(
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime>()
                )
            )
            .Returns(Task.CompletedTask);

        var emailMock = new Mock<IEmailService>();
        emailMock
            .Setup(e => e.SendAppointmentCreatedAsync(It.IsAny<AppointmentEmailDto>()))
            .Returns(Task.CompletedTask);
        emailMock
            .Setup(e =>
                e.SendAppointmentStatusChangedAsync(
                    It.IsAny<AppointmentEmailDto>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>()
                )
            )
            .Returns(Task.CompletedTask);

        var smsMock = new Mock<ISmsService>();
        smsMock
            .Setup(s =>
                s.SendAppointmentCreatedAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime>()
                )
            )
            .Returns(Task.CompletedTask);
        smsMock
            .Setup(s =>
                s.SendAppointmentCancelledAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime>()
                )
            )
            .Returns(Task.CompletedTask);
        smsMock
            .Setup(s =>
                s.SendAppointmentStatusChangedAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<string>()
                )
            )
            .Returns(Task.CompletedTask);

        var controller = new AppointmentController(
            db,
            notifyMock.Object,
            emailMock.Object,
            smsMock.Object
        );
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

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);
        var result = await CreateController(db, userId: 1, role: "Receiver")
            .Create(new AppointmentCreateDto(providerId, serviceId, slotId, "Not"));
        Assert.IsType<CreatedAtActionResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenSlotNotAvailable()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);
        db.TimeSlots.Find(slotId)!.Status = SlotStatus.Booked;
        await db.SaveChangesAsync();
        var result = await CreateController(db, userId: 1)
            .Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenInvalidSlot()
    {
        var db = CreateDb();
        var (providerId, serviceId, _) = await SeedAsync(db);
        var result = await CreateController(db, userId: 1)
            .Create(new AppointmentCreateDto(providerId, serviceId, 9999, null));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetMine_ShouldReturn200()
    {
        var db = CreateDb();
        var result = await CreateController(db, userId: 1)
            .GetMine(new AppointmentFilterDto(null, null, null));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Cancel_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        var result = await CreateController(db, userId: 1).Cancel(9999, new CancelDto(null));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Cancel_ShouldReturnForbid_WhenNotOwner()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);
        await CreateController(db, userId: 1)
            .Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        var apptId = db.Appointments.First().Id;
        var result = await CreateController(db, userId: 99).Cancel(apptId, new CancelDto(null));
        Assert.IsType<ForbidResult>(Unwrap(result));
    }

    [Fact]
    public async Task Cancel_ShouldReturn200_WhenOwner()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);
        await CreateController(db, userId: 1)
            .Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        var apptId = db.Appointments.First().Id;
        var result = await CreateController(db, userId: 1).Cancel(apptId, new CancelDto(null));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task UpdateStatus_ShouldReturn404_WhenNotExists()
    {
        var db = CreateDb();
        var result = await CreateController(db, userId: 2, role: "Provider")
            .UpdateStatus(9999, new AppointmentUpdateStatusDto("confirm", null));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task UpdateStatus_ShouldReturn200_WhenConfirm()
    {
        var db = CreateDb();
        var (providerId, serviceId, slotId) = await SeedAsync(db);
        await CreateController(db, userId: 1, role: "Receiver")
            .Create(new AppointmentCreateDto(providerId, serviceId, slotId, null));
        var apptId = db.Appointments.First().Id;
        var result = await CreateController(db, userId: 2, role: "Provider")
            .UpdateStatus(apptId, new AppointmentUpdateStatusDto("confirm", null));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }
}
