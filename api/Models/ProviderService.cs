namespace api.Models;

/// <summary>
/// Provider ile Service arasındaki many-to-many ilişki tablosu.
/// Bir provider, farklı fiyat/süre ile aynı hizmeti sunabilir.
/// </summary>
public class ProviderService
{
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    public int ServiceId { get; set; }
    public Service Service { get; set; } = null!;

    // Provider bu hizmeti farklı fiyata sunabilir (override)
    public decimal? CustomPrice { get; set; }
    public int? CustomDurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;
}
