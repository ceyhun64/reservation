// api.Tests/Unit/NotificationServiceUnitTest.cs

using api.Data;
using api.Hubs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests.Unit;

public class NotificationServiceUnitTest : IDisposable
{
    // ─── Her test için temiz bir InMemory DB ──────────────────
    private readonly AppDbContext _db;
    private readonly Mock<IHubContext<NotificationHub, INotificationHub>> _hubContextMock = new();
    private readonly Mock<ILogger<NotificationService>> _loggerMock = new();

    public NotificationServiceUnitTest()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // her test izole
            .Options;
        _db = new AppDbContext(options);
    }

    public void Dispose() => _db.Dispose();

    // ─── Helper: SignalR grup mock'unu kur ────────────────────
    private Mock<INotificationHub> SetupHubGroup(string userId)
    {
        var groupClientMock = new Mock<INotificationHub>();

        groupClientMock
            .Setup(c => c.ReceiveNotification(It.IsAny<NotificationPayload>()))
            .Returns(Task.CompletedTask);
        groupClientMock
            .Setup(c => c.UnreadCountUpdated(It.IsAny<int>()))
            .Returns(Task.CompletedTask);
        groupClientMock
            .Setup(c => c.AppointmentStatusChanged(It.IsAny<AppointmentStatusPayload>()))
            .Returns(Task.CompletedTask);

        _hubContextMock
            .Setup(h => h.Clients.Group(NotificationHub.GetUserGroup(userId)))
            .Returns(groupClientMock.Object);

        return groupClientMock;
    }

    private NotificationService CreateService() =>
        new(_db, _hubContextMock.Object, _loggerMock.Object);

    // ─────────────────────────────────────────────────────────
    // TEST 1: DB'ye kaydedilmeli VE SignalR push yapılmalı
    // ─────────────────────────────────────────────────────────
    [Fact]
    public async Task SendAsync_ShouldPersistToDb_AndPushViaSignalR()
    {
        // Arrange
        var groupMock = SetupHubGroup("42");
        var service = CreateService();

        // Act
        await service.SendAsync(42, "Test Title", "Test Message", "Info");

        // Assert — DB'ye kaydedildi mi?
        var saved = await _db.Notifications.FirstOrDefaultAsync();
        Assert.NotNull(saved);
        Assert.Equal(42, saved.UserId);
        Assert.Equal("Test Title", saved.Title);
        Assert.Equal("Test Message", saved.Message);
        Assert.Equal("Info", saved.Type);
        Assert.False(saved.IsRead);

        // Assert — SignalR push yapıldı mı?
        groupMock.Verify(
            c =>
                c.ReceiveNotification(
                    It.Is<NotificationPayload>(p =>
                        p.Title == "Test Title" && p.Message == "Test Message"
                    )
                ),
            Times.Once
        );

        groupMock.Verify(c => c.UnreadCountUpdated(It.IsAny<int>()), Times.Once);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 2: SignalR çökse bile DB kaydı korunmalı
    // ─────────────────────────────────────────────────────────
    [Fact]
    public async Task SendAsync_WhenSignalRFails_ShouldNotThrow_AndStillSaveToDB()
    {
        // Arrange — SignalR hub exception fırlatıyor
        _hubContextMock
            .Setup(h => h.Clients.Group(It.IsAny<string>()))
            .Throws(new Exception("SignalR connection lost"));

        var service = CreateService();

        // Act — exception fırlatmamalı
        var exception = await Record.ExceptionAsync(() =>
            service.SendAsync(42, "Title", "Message", "Warning")
        );

        // Assert — exception yutuldu
        Assert.Null(exception);

        // Assert — DB kaydı hâlâ var
        var count = await _db.Notifications.CountAsync();
        Assert.Equal(1, count);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 3: UnreadCount doğru hesaplanmalı
    // ─────────────────────────────────────────────────────────
    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnOnlyUnreadForUser()
    {
        // Arrange — 3 okunmamış (userId=1), 2 okunmuş (userId=1), 1 başka kullanıcı
        _db.Notifications.AddRange(
            new Notification
            {
                UserId = 1,
                Title = "A",
                Message = "",
                Type = "Info",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            },
            new Notification
            {
                UserId = 1,
                Title = "B",
                Message = "",
                Type = "Info",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            },
            new Notification
            {
                UserId = 1,
                Title = "C",
                Message = "",
                Type = "Info",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            },
            new Notification
            {
                UserId = 1,
                Title = "D",
                Message = "",
                Type = "Info",
                IsRead = true,
                CreatedAt = DateTime.UtcNow,
            },
            new Notification
            {
                UserId = 1,
                Title = "E",
                Message = "",
                Type = "Info",
                IsRead = true,
                CreatedAt = DateTime.UtcNow,
            },
            new Notification
            {
                UserId = 2,
                Title = "F",
                Message = "",
                Type = "Info",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        var count = await service.GetUnreadCountAsync(1);

        // Assert
        Assert.Equal(3, count);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 4: Randevu durumuna göre doğru başlık seçilmeli
    // ─────────────────────────────────────────────────────────
    [Theory]
    [InlineData("Confirmed", "Randevunuz Onaylandı ✓")]
    [InlineData("Rejected", "Randevunuz Reddedildi")]
    [InlineData("Completed", "Randevunuz Tamamlandı 🎉")]
    [InlineData("NoShow", "Randevu: Gelmedi")]
    [InlineData("SomethingElse", "Randevu Durumu Güncellendi")]
    public async Task SendAppointmentStatusChangedAsync_ShouldUseCorrectTitle(
        string status,
        string expectedTitle
    )
    {
        // Arrange
        SetupHubGroup("1");
        var service = CreateService();

        // Act
        await service.SendAppointmentStatusChangedAsync(
            userId: 1,
            appointmentId: 100,
            newStatus: status,
            serviceName: "Saç Kesimi",
            appointmentDate: DateTime.UtcNow.AddDays(1)
        );

        // Assert — DB'deki başlık doğru mu?
        var notification = await _db.Notifications.FirstOrDefaultAsync();
        Assert.NotNull(notification);
        Assert.Equal(expectedTitle, notification.Title);
        Assert.Equal(100, notification.AppointmentId);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 5: AppointmentStatusChanged SignalR eventi çağrılmalı
    // ─────────────────────────────────────────────────────────
    [Fact]
    public async Task SendAppointmentStatusChangedAsync_ShouldPushTypedSignalREvent()
    {
        // Arrange
        var groupMock = SetupHubGroup("1");
        var service = CreateService();
        var appointmentDate = DateTime.UtcNow.AddDays(2);

        // Act
        await service.SendAppointmentStatusChangedAsync(
            userId: 1,
            appointmentId: 55,
            newStatus: "Confirmed",
            serviceName: "Masaj",
            appointmentDate: appointmentDate
        );

        // Assert — AppointmentStatusChanged eventi doğru payload ile gönderildi mi?
        groupMock.Verify(
            c =>
                c.AppointmentStatusChanged(
                    It.Is<AppointmentStatusPayload>(p =>
                        p.AppointmentId == 55
                        && p.NewStatus == "Confirmed"
                        && p.ServiceName == "Masaj"
                    )
                ),
            Times.Once
        );
    }

    // ─────────────────────────────────────────────────────────
    // TEST 6: AppointmentId nullable — genel bildirimde null olabilir
    // ─────────────────────────────────────────────────────────
    [Fact]
    public async Task SendAsync_WithoutAppointmentId_ShouldSaveWithNullAppointmentId()
    {
        // Arrange
        SetupHubGroup("5");
        var service = CreateService();

        // Act — appointmentId verilmedi (default null)
        await service.SendAsync(5, "Sistem Bildirimi", "Bakım çalışması", "system");

        // Assert
        var saved = await _db.Notifications.FirstOrDefaultAsync();
        Assert.NotNull(saved);
        Assert.Null(saved.AppointmentId);
    }
}
