namespace api.Services;

public interface ISmsService
{
    Task SendAppointmentCreatedAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    );
    Task SendAppointmentStatusChangedAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime,
        string status
    );
    Task SendAppointmentCancelledAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    );
    Task SendAppointmentReminderAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    );
}
