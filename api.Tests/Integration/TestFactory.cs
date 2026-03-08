using api.Data;
using api.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace api.Tests.Integration;

public static class TestFactory
{
    public static HttpClient CreateClient(string? dbName = null)
    {
        dbName ??= Guid.NewGuid().ToString();

        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // ── DB override ───────────────────────────────────────────
                var dbDesc = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                        || d.ServiceType == typeof(AppDbContext)
                    )
                    .ToList();
                foreach (var d in dbDesc)
                    services.Remove(d);
                services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase(dbName));

                // ── Redis override → InMemory cache ───────────────────────
                var redisDesc = services
                    .Where(d =>
                        d.ServiceType == typeof(IDistributedCache)
                        || d.ServiceType == typeof(ICacheService)
                    )
                    .ToList();
                foreach (var d in redisDesc)
                    services.Remove(d);
                services.AddDistributedMemoryCache();
                services.AddScoped<ICacheService, RedisCacheService>();

                // ── Health checks override ────────────────────────────────
                // Program.cs'deki .AddNpgSql() ve .AddRedis() env'de
                // connection string olmadığı için patlıyor.
                // Tüm health check kayıtlarını temizleyip boş bırakıyoruz.
                var healthDescs = services
                    .Where(d =>
                        d.ServiceType == typeof(HealthCheckService)
                        || (d.ServiceType.FullName?.Contains("HealthCheck") ?? false)
                        || (d.ImplementationType?.FullName?.Contains("HealthCheck") ?? false)
                    )
                    .ToList();
                foreach (var d in healthDescs)
                    services.Remove(d);

                services.RemoveAll<IHealthCheckPublisher>();
                services.AddHealthChecks(); // boş, hiçbir şeyi kontrol etmez
            });
        });

        return factory.CreateClient();
    }
}
