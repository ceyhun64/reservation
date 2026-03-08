using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Tests.Unit;

public class ReviewControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private ReviewController CreateController(
        AppDbContext db,
        int userId = 1,
        string role = "Receiver"
    )
    {
        var controller = new ReviewController(db);
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

    private async Task<(int appointmentId, int providerId)> SeedCompletedAppointmentAsync(
        AppDbContext db
    )
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
            Name = "Test İşletme",
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
            StartTime = DateTime.UtcNow.AddDays(-1),
            EndTime = DateTime.UtcNow.AddDays(-1).AddHours(1),
            Status = SlotStatus.Booked,
        };
        db.TimeSlots.Add(slot);
        await db.SaveChangesAsync();
        var appointment = new Appointment
        {
            ReceiverId = 1,
            ProviderId = provider.Id,
            ServiceId = service.Id,
            TimeSlotId = slot.Id,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            PricePaid = service.Price,
            Status = AppointmentStatus.Completed,
        };
        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();
        return (appointment.Id, provider.Id);
    }

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    [Fact]
    public async Task GetByProvider_ShouldReturn200_WithEmptyList()
    {
        var db = CreateDb();
        var (_, providerId) = await SeedCompletedAppointmentAsync(db);
        var result = await CreateController(db).GetByProvider(providerId);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetByProvider_ShouldReturn200_WithReviews()
    {
        var db = CreateDb();
        var (appointmentId, providerId) = await SeedCompletedAppointmentAsync(db);
        db.Reviews.Add(
            new Review
            {
                AuthorId = 1,
                ProviderId = providerId,
                AppointmentId = appointmentId,
                Rating = 5,
                Comment = "Harika!",
                IsVisible = true,
            }
        );
        await db.SaveChangesAsync();
        var result = await CreateController(db).GetByProvider(providerId);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn200_WhenValidData()
    {
        var db = CreateDb();
        var (appointmentId, _) = await SeedCompletedAppointmentAsync(db);
        var result = await CreateController(db, userId: 1, role: "Receiver")
            .Create(new ReviewCreateDto(appointmentId, 5, "Mükemmel!"));
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenAppointmentNotExists()
    {
        var result = await CreateController(CreateDb(), userId: 1)
            .Create(new ReviewCreateDto(9999, 5, "Yorum"));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturnForbid_WhenNotReceiver()
    {
        var db = CreateDb();
        var (appointmentId, _) = await SeedCompletedAppointmentAsync(db);
        var result = await CreateController(db, userId: 99)
            .Create(new ReviewCreateDto(appointmentId, 4, "Test"));
        Assert.IsType<ForbidResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenAppointmentNotCompleted()
    {
        var db = CreateDb();
        var (appointmentId, _) = await SeedCompletedAppointmentAsync(db);
        db.Appointments.Find(appointmentId)!.Status = AppointmentStatus.Pending;
        await db.SaveChangesAsync();
        var result = await CreateController(db, userId: 1)
            .Create(new ReviewCreateDto(appointmentId, 4, "Test"));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenAlreadyReviewed()
    {
        var db = CreateDb();
        var (appointmentId, providerId) = await SeedCompletedAppointmentAsync(db);
        db.Reviews.Add(
            new Review
            {
                AuthorId = 1,
                ProviderId = providerId,
                AppointmentId = appointmentId,
                Rating = 4,
                Comment = "İyi",
                IsVisible = true,
            }
        );
        await db.SaveChangesAsync();
        var result = await CreateController(db, userId: 1)
            .Create(new ReviewCreateDto(appointmentId, 5, "Tekrar"));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Reply_ShouldReturn200_WhenProviderOwner()
    {
        var db = CreateDb();
        var (appointmentId, providerId) = await SeedCompletedAppointmentAsync(db);
        var review = new Review
        {
            AuthorId = 1,
            ProviderId = providerId,
            AppointmentId = appointmentId,
            Rating = 5,
            Comment = "Harika!",
            IsVisible = true,
        };
        db.Reviews.Add(review);
        await db.SaveChangesAsync();
        var result = await CreateController(db, userId: 2, role: "Provider")
            .Reply(review.Id, new ReviewReplyDto("Teşekkürler!"));
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.Equal("Teşekkürler!", db.Reviews.Find(review.Id)!.ProviderReply);
    }

    [Fact]
    public async Task Reply_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb(), userId: 2, role: "Provider")
            .Reply(9999, new ReviewReplyDto("Cevap"));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Hide_ShouldReturn200_WhenAdmin()
    {
        var db = CreateDb();
        var (appointmentId, providerId) = await SeedCompletedAppointmentAsync(db);
        var review = new Review
        {
            AuthorId = 1,
            ProviderId = providerId,
            AppointmentId = appointmentId,
            Rating = 3,
            Comment = "Orta",
            IsVisible = true,
        };
        db.Reviews.Add(review);
        await db.SaveChangesAsync();
        var result = await CreateController(db, userId: 1, role: "Admin").Hide(review.Id);
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.False(db.Reviews.Find(review.Id)!.IsVisible);
    }

    [Fact]
    public async Task Hide_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb(), userId: 1, role: "Admin").Hide(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }
}
