using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Services;

public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var data = await _cache.GetStringAsync(key);
            if (data is null)
                return default;
            return JsonSerializer.Deserialize<T>(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache GET başarısız: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(30),
            };
            var data = JsonSerializer.Serialize(value);
            await _cache.SetStringAsync(key, data, options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache SET başarısız: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _cache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache REMOVE başarısız: {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        // IDistributedCache prefix silmeyi desteklemez, key convention ile çözüyoruz.
        // Production'da Redis'in SCAN komutu kullanılır, burada bilinen key'leri temizliyoruz.
        var knownKeys = new[] { $"{prefix}all", $"{prefix}tree" };
        foreach (var key in knownKeys)
            await RemoveAsync(key);
    }
}
