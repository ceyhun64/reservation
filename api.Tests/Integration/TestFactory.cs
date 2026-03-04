using api.Data;
using api.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;

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
                // DB override
                var dbDesc = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                        || d.ServiceType == typeof(AppDbContext)
                    )
                    .ToList();
                foreach (var d in dbDesc)
                    services.Remove(d);
                services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase(dbName));

                // Redis override → InMemory cache
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
            });
        });

        return factory.CreateClient();
    }
}
