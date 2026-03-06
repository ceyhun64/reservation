using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace api.Services;

public class SmsService : ISmsService
{
    private readonly string _fromNumber;
    private readonly ILogger<SmsService> _logger;

    public SmsService(IConfiguration configuration, ILogger<SmsService> logger)
    {
        _logger = logger;
        var accountSid = configuration["Twilio:AccountSid"]!;
        var authToken = configuration["Twilio:AuthToken"]!;
        _fromNumber = configuration["Twilio:FromNumber"]!;

        TwilioClient.Init(accountSid, authToken);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public Task SendAppointmentCreatedAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    ) =>
        Send(
            toPhone,
            $"Merhaba {N(customerName)}, {N(businessName)} icin "
                + $"{appointmentTime:dd.MM.yyyy HH:mm} tarihli randevunuz olusturuldu. "
                + "Iyi gunler!"
        );

    public Task SendAppointmentStatusChangedAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime,
        string status
    )
    {
        var statusText = status.ToLower() switch
        {
            "confirmed" => "onaylandi",
            "rejected" => "reddedildi",
            "completed" => "tamamlandi",
            "noshow" => "gelmedi olarak isaretlendi",
            _ => N(status),
        };

        return Send(
            toPhone,
            $"Merhaba {N(customerName)}, {N(businessName)} icin "
                + $"{appointmentTime:dd.MM.yyyy HH:mm} tarihli randevunuz {statusText}."
        );
    }

    public Task SendAppointmentCancelledAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    ) =>
        Send(
            toPhone,
            $"Merhaba {N(customerName)}, {N(businessName)} icin "
                + $"{appointmentTime:dd.MM.yyyy HH:mm} tarihli randevunuz iptal edildi."
        );

    public Task SendAppointmentReminderAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    ) =>
        Send(
            toPhone,
            $"Hatirlatma: {appointmentTime:dd.MM.yyyy HH:mm} tarihinde "
                + $"{N(businessName)} randevunuz bulunmaktadir. "
                + $"Iyi gunler, {N(customerName)}!"
        );

    // ── Private helpers ───────────────────────────────────────────────────────

    /// <summary>
    /// Normalizes Turkish characters to their GSM 7-bit ASCII equivalents
    /// so Twilio never garbles names or business titles.
    /// </summary>
    private static string N(string text) =>
        text.Replace('ç', 'c')
            .Replace('Ç', 'C')
            .Replace('ğ', 'g')
            .Replace('Ğ', 'G')
            .Replace('ı', 'i')
            .Replace('İ', 'I')
            .Replace('ö', 'o')
            .Replace('Ö', 'O')
            .Replace('ş', 's')
            .Replace('Ş', 'S')
            .Replace('ü', 'u')
            .Replace('Ü', 'U');

    private async Task Send(string toPhone, string message)
    {
        try
        {
            await MessageResource.CreateAsync(
                to: new PhoneNumber(toPhone),
                from: new PhoneNumber(_fromNumber),
                body: message
            );
            _logger.LogInformation("SMS gonderildi: {Phone}", toPhone);
        }
        catch (Exception ex)
        {
            // SMS hatası uygulamayı durdurmamalı, sadece logla
            _logger.LogError(ex, "SMS gonderilemedi: {Phone}", toPhone);
        }
    }
}
