using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class ReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReminderBackgroundService> _logger;

    public ReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<ReminderBackgroundService> logger
    )
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var nextRun = now.Date.AddDays(1).AddHours(6); // UTC 06:00 = TR 09:00
            var delay = nextRun - now;

            _logger.LogInformation("Sonraki hatırlatma: {NextRun}", nextRun);
            await Task.Delay(delay, stoppingToken);

            await SendRemindersAsync(stoppingToken);
        }
    }

    private async Task SendRemindersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); // ← değişti
        var sms = scope.ServiceProvider.GetRequiredService<ISmsService>();

        var tomorrow = DateTime.UtcNow.Date.AddDays(1);

        var appointments = await db
            .Appointments.Include(a => a.Receiver)
            .Include(a => a.Service)
                .ThenInclude(s => s.Business) // ← Service üzerinden
            .Where(a =>
                a.StartTime.Date == tomorrow
                && // ← bu da yok, StartTime kullan
                a.Status == AppointmentStatus.Confirmed
                && a.Receiver.Phone != null
            )
            .ToListAsync(ct);

        _logger.LogInformation("{Count} hatırlatma SMS'i gönderilecek", appointments.Count);

        foreach (var appointment in appointments)
        {
            await sms.SendAppointmentReminderAsync(
                appointment.Receiver.Phone!,
                appointment.Receiver.FullName,
                appointment.Service.Business.Name,
                appointment.StartTime
            );
        }
    }
}
