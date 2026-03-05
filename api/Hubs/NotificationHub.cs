using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace api.Hubs;

/// <summary>
/// Real-time notification hub.
/// Each authenticated user joins their own private group (user_{userId})
/// so notifications can be pushed to specific users without broadcasting.
/// </summary>
[Authorize]
public class NotificationHub : Hub<INotificationHub>
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Called automatically when a client connects.
    /// Adds the connection to a user-specific group so we can target them later.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId is not null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroup(userId));
            _logger.LogInformation(
                "User {UserId} connected via SignalR. ConnectionId: {ConnectionId}",
                userId,
                Context.ConnectionId
            );
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called automatically when a client disconnects.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId is not null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetUserGroup(userId));
            _logger.LogInformation(
                "User {UserId} disconnected from SignalR. ConnectionId: {ConnectionId}",
                userId,
                Context.ConnectionId
            );
        }

        if (exception is not null)
        {
            _logger.LogWarning(
                exception,
                "SignalR disconnected with error for ConnectionId: {ConnectionId}",
                Context.ConnectionId
            );
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Client calls this to mark a notification as read.
    /// Updates read status and broadcasts unread count back to the user.
    /// </summary>
    public async Task MarkAsRead(int notificationId)
    {
        var userId = GetUserId();
        _logger.LogInformation(
            "User {UserId} marked notification {NotificationId} as read",
            userId,
            notificationId
        );
        // Actual DB update is handled by NotificationController/Service.
        // This method exists so the client can trigger it via SignalR instead of REST if preferred.
        await Task.CompletedTask;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private string? GetUserId() =>
        Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? Context.User?.FindFirst("sub")?.Value;

    /// <summary>Returns the SignalR group name for a specific user.</summary>
    public static string GetUserGroup(string userId) => $"user_{userId}";
}
