using SendGrid;
using SendGrid.Helpers.Mail;

namespace api.Services;

// ─── Interface ────────────────────────────────────────────────
public interface IEmailService
{
    Task SendWelcomeAsync(string toEmail, string toName, string role);
    Task SendAppointmentCreatedAsync(AppointmentEmailDto dto);
    Task SendAppointmentStatusChangedAsync(
        AppointmentEmailDto dto,
        string newStatus,
        string? reason = null
    );
    Task SendAppointmentReminderAsync(AppointmentEmailDto dto);
}

// ─── DTO ──────────────────────────────────────────────────────
public record AppointmentEmailDto(
    string ReceiverEmail,
    string ReceiverName,
    string ProviderEmail,
    string ProviderName,
    string ServiceName,
    string BusinessName,
    DateTime AppointmentDate,
    decimal Price,
    int AppointmentId
);

// ─── Implementation ───────────────────────────────────────────
public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    private string FromEmail => _config["Email:FromEmail"]!;
    private string FromName => _config["Email:FromName"] ?? "Randevu Sistemi";
    private string ApiKey => _config["Email:SendGridApiKey"]!;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    // ── 0. Hoş geldin maili ───────────────────────────────────
    public async Task SendWelcomeAsync(string toEmail, string toName, string role)
    {
        var roleLabel = role switch
        {
            "Provider" => "İşletme Sahibi",
            "Admin" => "Yönetici",
            _ => "Müşteri",
        };

        await SendAsync(
            toEmail: toEmail,
            toName: toName,
            subject: "🎉 Hoş Geldiniz — Randevu Sistemine Kaydınız Tamamlandı",
            html: WelcomeHtml(toName, roleLabel)
        );
    }

    // ── 1. Randevu oluşturuldu ────────────────────────────────
    public async Task SendAppointmentCreatedAsync(AppointmentEmailDto dto)
    {
        await SendAsync(
            dto.ReceiverEmail,
            dto.ReceiverName,
            $"✅ Randevu Talebiniz Alındı — {dto.ServiceName}",
            AppointmentCreatedReceiverHtml(dto)
        );

        await SendAsync(
            dto.ProviderEmail,
            dto.ProviderName,
            $"🔔 Yeni Randevu Talebi — {dto.ServiceName}",
            AppointmentCreatedProviderHtml(dto)
        );
    }

    // ── 2. Randevu durumu değişti ─────────────────────────────
    public async Task SendAppointmentStatusChangedAsync(
        AppointmentEmailDto dto,
        string newStatus,
        string? reason = null
    )
    {
        string subject;
        string html;
        string targetEmail;
        string targetName;

        switch (newStatus)
        {
            case "Confirmed":
                subject = $"✅ Randevunuz Onaylandı — {dto.ServiceName}";
                html = ConfirmedHtml(dto);
                targetEmail = dto.ReceiverEmail;
                targetName = dto.ReceiverName;
                break;

            case "Rejected":
                subject = $"❌ Randevunuz Reddedildi — {dto.ServiceName}";
                html = RejectedHtml(dto, reason);
                targetEmail = dto.ReceiverEmail;
                targetName = dto.ReceiverName;
                break;

            case "Completed":
                subject = "🎉 Randevunuz Tamamlandı — Değerlendirme Yapın";
                html = CompletedHtml(dto);
                targetEmail = dto.ReceiverEmail;
                targetName = dto.ReceiverName;
                break;

            case "CancelledByReceiver":
                subject = $"🔔 Randevu İptal Edildi — {dto.ServiceName}";
                html = CancelledProviderHtml(dto);
                targetEmail = dto.ProviderEmail;
                targetName = dto.ProviderName;
                break;

            case "NoShow":
                subject = $"⚠️ Randevu: Gelmedi — {dto.ServiceName}";
                html = NoShowHtml(dto);
                targetEmail = dto.ReceiverEmail;
                targetName = dto.ReceiverName;
                break;

            default:
                return;
        }

        await SendAsync(targetEmail, targetName, subject, html);
    }

    // ── 3. Hatırlatma ─────────────────────────────────────────
    public async Task SendAppointmentReminderAsync(AppointmentEmailDto dto)
    {
        await SendAsync(
            dto.ReceiverEmail,
            dto.ReceiverName,
            $"⏰ Randevu Hatırlatması — Yarın {dto.AppointmentDate:HH:mm}",
            ReminderHtml(dto)
        );
    }

    // ─── Core send ────────────────────────────────────────────
    private async Task SendAsync(string toEmail, string toName, string subject, string html)
    {
        try
        {
            var client = new SendGridClient(ApiKey);
            var from = new EmailAddress(FromEmail, FromName);
            var to = new EmailAddress(toEmail, toName);
            var message = MailHelper.CreateSingleEmail(from, to, subject, null, html);
            var response = await client.SendEmailAsync(message);

            if ((int)response.StatusCode >= 400)
            {
                var body = await response.Body.ReadAsStringAsync();
                _logger.LogWarning("SendGrid hata {Code}: {Body}", response.StatusCode, body);
            }
            else
            {
                _logger.LogInformation("Email gönderildi → {To} | {Subject}", toEmail, subject);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email gönderilemedi → {To} | {Subject}", toEmail, subject);
        }
    }

    // ─── HTML Templates ───────────────────────────────────────

    private static string BaseLayout(string title, string accentColor, string body) =>
        $"""
            <!DOCTYPE html>
            <html lang="tr">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>{title}</title>
            </head>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:32px 16px;">
                  <table width="560" cellpadding="0" cellspacing="0"
                         style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
                    <tr>
                      <td style="background:{accentColor};padding:28px 32px;">
                        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">{title}</h1>
                      </td>
                    </tr>
                    <tr><td style="padding:28px 32px;">{body}</td></tr>
                    <tr>
                      <td style="background:#f4f4f5;padding:16px 32px;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                          Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

    private static string InfoRow(string label, string value) =>
        $"""
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">{label}</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">{value}</td>
            </tr>
            """;

    private static string AppointmentTable(AppointmentEmailDto dto) =>
        $"""
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
              {InfoRow("Hizmet", dto.ServiceName)}
              {InfoRow("İşletme", dto.BusinessName)}
              {InfoRow("Sağlayıcı", dto.ProviderName)}
              {InfoRow("Tarih & Saat", dto.AppointmentDate.ToString("dd MMMM yyyy, HH:mm"))}
              {InfoRow("Ücret", $"₺{dto.Price:N2}")}
            </table>
            """;

    private static string WelcomeHtml(string name, string roleLabel) =>
        BaseLayout(
            "Hoş Geldiniz! 🎉",
            "#2563eb",
            $"""
                <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                  Merhaba <strong>{name}</strong>,
                </p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Randevu sistemine başarıyla kayıt oldunuz.
                  Hesabınız <strong>{roleLabel}</strong> olarak tanımlanmıştır.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f0f9ff;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #2563eb;">
                  <tr>
                    <td style="font-size:14px;color:#1e40af;">
                      Artık sisteme giriş yaparak randevu alabilir veya hizmetlerinizi yönetebilirsiniz.
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">İyi kullanımlar dileriz 🙌</p>
            """
        );

    private static string AppointmentCreatedReceiverHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Randevu Talebiniz Alındı",
            "#2563eb",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ReceiverName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Randevu talebiniz başarıyla alındı. Sağlayıcı onayladığında bildirim gönderilecektir.
                </p>
                {AppointmentTable(dto)}
                <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">Randevu No: <strong>#{dto.AppointmentId}</strong></p>
            """
        );

    private static string AppointmentCreatedProviderHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Yeni Randevu Talebi",
            "#7c3aed",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ProviderName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  <strong>{dto.ReceiverName}</strong> adlı müşteriden yeni bir randevu talebi aldınız.
                </p>
                {AppointmentTable(dto)}
            """
        );

    private static string ConfirmedHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Randevunuz Onaylandı ✓",
            "#16a34a",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ReceiverName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Randevunuz onaylandı. Belirtilen tarih ve saatte hazır olunuz.
                </p>
                {AppointmentTable(dto)}
            """
        );

    private static string RejectedHtml(AppointmentEmailDto dto, string? reason) =>
        BaseLayout(
            "Randevunuz Reddedildi",
            "#dc2626",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ReceiverName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Üzgünüz, randevu talebiniz reddedildi.
                  {(reason is not null ? $"<br/>Sebep: <em>{reason}</em>" : "")}
                </p>
                {AppointmentTable(dto)}
            """
        );

    private static string CompletedHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Randevunuz Tamamlandı 🎉",
            "#0891b2",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ReceiverName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Randevunuz tamamlandı. Deneyiminizi değerlendirmeyi unutmayın!
                </p>
                {AppointmentTable(dto)}
            """
        );

    private static string CancelledProviderHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Randevu İptal Edildi",
            "#f59e0b",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ProviderName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  <strong>{dto.ReceiverName}</strong> adlı müşteri randevusunu iptal etti.
                  Zaman dilimi tekrar müsait hale getirildi.
                </p>
                {AppointmentTable(dto)}
            """
        );

    private static string NoShowHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Randevu: Gelmedi",
            "#6b7280",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ReceiverName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Aşağıdaki randevunuza gelmediniz olarak işaretlendi.
                </p>
                {AppointmentTable(dto)}
            """
        );

    private static string ReminderHtml(AppointmentEmailDto dto) =>
        BaseLayout(
            "Randevu Hatırlatması ⏰",
            "#f59e0b",
            $"""
                <p style="margin:0 0 8px;font-size:15px;color:#374151;">Merhaba <strong>{dto.ReceiverName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                  Yarın bir randevunuz var. Hazırlıklı olunuz!
                </p>
                {AppointmentTable(dto)}
            """
        );
}
