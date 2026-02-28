using api.Data;
using api.Models;

namespace api.Services;

public interface INotificationService
{
    Task SendAsync(int userId, string title, string message, string type = "Info", int? appointmentId = null);
    Task SendToManyAsync(IEnumerable<int> userIds, string title, string message, string type = "Info");
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db) => _db = db;

    public async Task SendAsync(int userId, string title, string message, string type = "Info", int? appointmentId = null)
    {
        var notification = new Notification
        {
            UserId        = userId,
            Title         = title,
            Message       = message,
            Type          = type,
            AppointmentId = appointmentId
        };
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
    }

    public async Task SendToManyAsync(IEnumerable<int> userIds, string title, string message, string type = "Info")
    {
        var notifications = userIds.Select(uid => new Notification
        {
            UserId  = uid,
            Title   = title,
            Message = message,
            Type    = type
        });
        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync();
    }
}