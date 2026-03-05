namespace api.Hubs;

/// <summary>
/// Defines the methods that can be called on connected SignalR clients.
/// Using a typed hub interface enables compile-time safety and unit testability.
/// </summary>
public interface INotificationHub
{
    /// <summary>Sends a real-time notification payload to the client.</summary>
    Task ReceiveNotification(NotificationPayload payload);

    /// <summary>Notifies the client that an appointment's status has changed.</summary>
    Task AppointmentStatusChanged(AppointmentStatusPayload payload);

    /// <summary>Notifies the client of unread notification count.</summary>
    Task UnreadCountUpdated(int count);
}

public record NotificationPayload(
    int Id,
    string Title,
    string Message,
    string Type, // "appointment", "review", "system"
    bool IsRead,
    DateTime CreatedAt
);

public record AppointmentStatusPayload(
    int AppointmentId,
    string NewStatus, // "Pending", "Confirmed", "Cancelled", "Completed"
    string ServiceName,
    DateTime AppointmentDate
);
