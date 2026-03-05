using api.Data;
using api.Hubs;
using api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public interface INotificationService
{
    /// <summary>Mevcut controller'lardaki SendAsync imzasıyla uyumlu — hiçbir şeyi kırmaz.</summary>
    Task SendAsync(
        int userId,
        string title,
        string message,
        string type,
        int? appointmentId = null
    );

    /// <summary>Randevu durum değişikliğinde hem DB hem SignalR push yapar.</summary>
    Task SendAppointmentStatusChangedAsync(
        int userId,
        int appointmentId,
        string newStatus,
        string serviceName,
        DateTime appointmentDate
    );

    Task<int> GetUnreadCountAsync(int userId);
}

/// <summary>
/// DB persist + SignalR push tek serviste.
/// AppDbContext direkt inject edildi — mevcut controller mimarinizle uyumlu.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationHub, INotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        AppDbContext db,
        IHubContext<NotificationHub, INotificationHub> hubContext,
        ILogger<NotificationService> logger
    )
    {
        _db = db;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Bildirim DB'ye kaydedilir, ardından kullanıcının SignalR grubuna push yapılır.
    /// Kullanıcı offline olsa bile bildirim DB'de durur (REST fallback çalışır).
    /// </summary>
    public async Task SendAsync(
        int userId,
        string title,
        string message,
        string type,
        int? appointmentId = null
    )
    {
        // 1. DB'ye kaydet
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            AppointmentId = appointmentId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Notification saved → User {UserId} | {Title}", userId, title);

        // 2. SignalR push (offline kullanıcı için sessizce geç)
        try
        {
            var group = NotificationHub.GetUserGroup(userId.ToString());

            await _hubContext
                .Clients.Group(group)
                .ReceiveNotification(
                    new NotificationPayload(
                        notification.Id,
                        notification.Title,
                        notification.Message,
                        notification.Type,
                        notification.IsRead,
                        notification.CreatedAt
                    )
                );

            var unread = await GetUnreadCountAsync(userId);
            await _hubContext.Clients.Group(group).UnreadCountUpdated(unread);

            _logger.LogInformation("SignalR push OK → User {UserId}", userId);
        }
        catch (Exception ex)
        {
            // SignalR başarısız olsa bile DB kaydı kalır — exception yutulur
            _logger.LogWarning(
                ex,
                "SignalR push FAILED for User {UserId}. Notification still in DB.",
                userId
            );
        }
    }

    /// <summary>
    /// Provider randevu durumunu değiştirdiğinde çağrılır.
    /// Hem genel bildirim hem de randevuya özel typed event gönderir.
    /// </summary>
    public async Task SendAppointmentStatusChangedAsync(
        int userId,
        int appointmentId,
        string newStatus,
        string serviceName,
        DateTime appointmentDate
    )
    {
        var (title, msgType) = newStatus switch
        {
            "Confirmed" => ("Randevunuz Onaylandı ✓", "Success"),
            "Rejected" => ("Randevunuz Reddedildi", "Warning"),
            "Completed" => ("Randevunuz Tamamlandı 🎉", "Success"),
            "NoShow" => ("Randevu: Gelmedi", "Warning"),
            _ => ("Randevu Durumu Güncellendi", "Info"),
        };

        var message =
            $"{serviceName} için {appointmentDate:dd MMM yyyy HH:mm} "
            + $"tarihli randevunuzun durumu '{newStatus}' olarak güncellendi.";

        await SendAsync(userId, title, message, msgType, appointmentId);

        // Ek olarak typed AppointmentStatusChanged eventi gönder
        try
        {
            var group = NotificationHub.GetUserGroup(userId.ToString());
            await _hubContext
                .Clients.Group(group)
                .AppointmentStatusChanged(
                    new AppointmentStatusPayload(
                        appointmentId,
                        newStatus,
                        serviceName,
                        appointmentDate
                    )
                );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "AppointmentStatusChanged SignalR push FAILED for User {UserId}",
                userId
            );
        }
    }

    public async Task<int> GetUnreadCountAsync(int userId) =>
        await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
}
