// api.Tests/Unit/EmailServiceUnitTest.cs

using api.Data;
using api.Models;
using api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests.Unit;

/// <summary>
/// EmailService testleri — SendGrid gerçek API çağrısı yapmaz,
/// geçersiz API key ile exception yutulup loglama test edilir.
/// </summary>
public class EmailServiceUnitTest
{
    private static IConfiguration BuildConfig(string apiKey = "SG.test_invalid_key") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Email:SendGridApiKey"] = apiKey,
                    ["Email:FromEmail"] = "test@example.com",
                    ["Email:FromName"] = "Test Sistemi",
                }
            )
            .Build();

    private static AppointmentEmailDto SampleDto() =>
        new(
            ReceiverEmail: "receiver@test.com",
            ReceiverName: "Ali Veli",
            ProviderEmail: "provider@test.com",
            ProviderName: "Kuaför Mehmet",
            ServiceName: "Saç Kesimi",
            BusinessName: "Mehmet Kuaför Salonu",
            AppointmentDate: DateTime.UtcNow.AddDays(2),
            Price: 150m,
            AppointmentId: 42
        );

    // ─── Test 1: Email gönderimi exception fırlatmamalı ───────
    [Fact]
    public async Task SendAppointmentCreatedAsync_ShouldNotThrow()
    {
        var loggerMock = new Mock<ILogger<EmailService>>();
        var service = new EmailService(BuildConfig(), loggerMock.Object);

        // SendGrid'e geçersiz key ile istek atar, 401 döner
        // Servis bunu yakalamalı ve exception fırlatmamalı
        var exception = await Record.ExceptionAsync(() =>
            service.SendAppointmentCreatedAsync(SampleDto())
        );

        Assert.Null(exception);
    }

    // ─── Test 2: Tüm durum geçişleri exception fırlatmamalı ──
    [Theory]
    [InlineData("Confirmed")]
    [InlineData("Rejected")]
    [InlineData("Completed")]
    [InlineData("CancelledByReceiver")]
    [InlineData("NoShow")]
    [InlineData("UnknownStatus")] // bilinmeyen durum → sessizce geçmeli
    public async Task SendAppointmentStatusChangedAsync_AllStatuses_ShouldNotThrow(string status)
    {
        var loggerMock = new Mock<ILogger<EmailService>>();
        var service = new EmailService(BuildConfig(), loggerMock.Object);

        var exception = await Record.ExceptionAsync(() =>
            service.SendAppointmentStatusChangedAsync(SampleDto(), status, "Test sebebi")
        );

        Assert.Null(exception);
    }

    // ─── Test 3: Hatırlatma maili exception fırlatmamalı ─────
    [Fact]
    public async Task SendAppointmentReminderAsync_ShouldNotThrow()
    {
        var loggerMock = new Mock<ILogger<EmailService>>();
        var service = new EmailService(BuildConfig(), loggerMock.Object);

        var exception = await Record.ExceptionAsync(() =>
            service.SendAppointmentReminderAsync(SampleDto())
        );

        Assert.Null(exception);
    }

    // ─── Test 4: Boş API key ile LogError çağrılmalı ─────────
    [Fact]
    public async Task SendAsync_WithEmptyApiKey_ShouldLogError()
    {
        var loggerMock = new Mock<ILogger<EmailService>>();
        var service = new EmailService(BuildConfig(apiKey: ""), loggerMock.Object);

        await service.SendAppointmentCreatedAsync(SampleDto());

        // ILogger.LogError çağrıldı mı?
        loggerMock.Verify(
            l =>
                l.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("Email gönderilemedi")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()
                ),
            Times.AtLeastOnce
        );
    }
}
