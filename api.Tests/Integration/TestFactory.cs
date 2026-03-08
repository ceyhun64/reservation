using System.Net.Http.Json;
using api.Data;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace api.Tests.Integration;

// ── Fake servisler ────────────────────────────────────────────────────────────

public class FakeEmailService : IEmailService
{
    public Task SendWelcomeAsync(string toEmail, string toName, string role) => Task.CompletedTask;

    public Task SendAppointmentCreatedAsync(AppointmentEmailDto dto) => Task.CompletedTask;

    public Task SendAppointmentStatusChangedAsync(
        AppointmentEmailDto dto,
        string newStatus,
        string? reason = null
    ) => Task.CompletedTask;

    public Task SendAppointmentReminderAsync(AppointmentEmailDto dto) => Task.CompletedTask;
}

public class FakeSmsService : ISmsService
{
    public Task SendAppointmentCreatedAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    ) => Task.CompletedTask;

    public Task SendAppointmentStatusChangedAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime,
        string status
    ) => Task.CompletedTask;

    public Task SendAppointmentCancelledAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    ) => Task.CompletedTask;

    public Task SendAppointmentReminderAsync(
        string toPhone,
        string customerName,
        string businessName,
        DateTime appointmentTime
    ) => Task.CompletedTask;
}

// ── TestFactory ───────────────────────────────────────────────────────────────

public static class TestFactory
{
    private static readonly System.Text.Json.JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static WebApplicationFactory<Program>? _baseFactory;
    private static readonly object _lock = new();

    // Admin test kullanıcısı — InMemory DB'ye direkt eklenir
    private const string AdminSeedEmail = "admin@rezervo.com";
    private const string AdminSeedPassword = "Test.123!";

    private static void ConfigureTestServices(IServiceCollection services, string dbName)
    {
        // ── DB: Npgsql'i tamamen çıkar, InMemory ekle ─────────────────────
        var toRemove = services
            .Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                || d.ServiceType == typeof(AppDbContext)
                || (d.ServiceType.FullName?.Contains("DbContextOptions") ?? false)
            )
            .ToList();
        foreach (var d in toRemove)
            services.Remove(d);

        services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase(dbName));

        // ── Redis → FakeCache ──────────────────────────────────────────────
        services.RemoveAll<IDistributedCache>();
        services.RemoveAll<ICacheService>();
        services.AddDistributedMemoryCache();
        services.AddScoped<ICacheService, FakeCacheService>();

        // ── Email & SMS → Fake ─────────────────────────────────────────────
        services.RemoveAll<IEmailService>();
        services.RemoveAll<ISmsService>();
        services.AddScoped<IEmailService, FakeEmailService>();
        services.AddScoped<ISmsService, FakeSmsService>();

        // ── Health checks → boş ───────────────────────────────────────────
        services.RemoveAll<IHealthCheckPublisher>();
        var hcDescs = services
            .Where(d =>
                (d.ServiceType.FullName?.Contains("HealthCheck") ?? false)
                || (d.ImplementationType?.FullName?.Contains("HealthCheck") ?? false)
            )
            .ToList();
        foreach (var d in hcDescs)
            services.Remove(d);
        services.AddHealthChecks();

        // ── Rate Limiter → kaldır ──────────────────────────────────────────
        var rateLimitDescs = services
            .Where(d =>
                (d.ServiceType.FullName?.Contains("RateLimit") ?? false)
                || (d.ImplementationType?.FullName?.Contains("RateLimit") ?? false)
            )
            .ToList();
        foreach (var d in rateLimitDescs)
            services.Remove(d);

        // ── Serilog çakışmasını önle ───────────────────────────────────────
        services.RemoveAll<ILoggerFactory>();
        services.AddLogging(b => b.ClearProviders().AddConsole());
    }

    private static WebApplicationFactory<Program> GetBaseFactory()
    {
        if (_baseFactory != null)
            return _baseFactory;
        lock (_lock)
        {
            if (_baseFactory != null)
                return _baseFactory;
            _baseFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting("environment", "Testing");
                builder.ConfigureServices(services =>
                    ConfigureTestServices(services, "TestDb_Shared")
                );
            });

            // InMemory DB'ye admin kullanıcısını direkt ekle.
            // Program.cs test ortamında DataSeeder.SeedAsync çalıştırmadığı için gerekli.
            SeedAdminUserAsync(_baseFactory).GetAwaiter().GetResult();
        }
        return _baseFactory;
    }

    /// <summary>
    /// InMemory DB'ye admin kullanıcısını direkt ekler.
    /// </summary>
    private static async Task SeedAdminUserAsync(WebApplicationFactory<Program> factory)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var exists = await db.Users.AnyAsync(u => u.Email == AdminSeedEmail);
        if (exists)
            return;

        db.Users.Add(
            new User
            {
                FullName = "Admin Kullanıcı",
                Email = AdminSeedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminSeedPassword),
                Phone = "5301237001",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await db.SaveChangesAsync();
    }

    public static HttpClient CreateClient(string? dbName = null)
    {
        if (dbName == null)
            return GetBaseFactory().CreateClient();

        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("environment", "Testing");
            builder.ConfigureServices(services => ConfigureTestServices(services, dbName));
        });

        // İzole DB için de admin seed yap
        SeedAdminUserAsync(factory).GetAwaiter().GetResult();

        return factory.CreateClient();
    }

    /// <summary>
    /// Register + login yaparak JWT token döner.
    /// Admin rolü için DB'ye seed edilmiş kullanıcıyla login yapar.
    /// </summary>
    public static async Task<string> GetTokenAsync(
        HttpClient client,
        string role = "Receiver",
        string? email = null,
        string password = "Test123!"
    )
    {
        // Admin rolü register endpoint'i üzerinden atanamaz;
        // SeedAdminUserAsync ile eklenen kullanıcıyla direkt login yapılır.
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return await LoginAsync(client, AdminSeedEmail, AdminSeedPassword);
        }

        // Diğer roller için yeni kullanıcı oluştur
        email ??= $"{Guid.NewGuid()}@test.com";

        var registerRes = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test User",
                email,
                password,
                phone = "5551234567",
                role,
            }
        );

        if (!registerRes.IsSuccessStatusCode)
        {
            var body = await registerRes.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Register başarısız (role={role}, status={registerRes.StatusCode}): {body}"
            );
        }

        return await LoginAsync(client, email, password);
    }

    /// <summary>
    /// Yalnızca login yaparak token döner. Kullanıcı zaten var olmalı.
    /// </summary>
    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        if (!loginRes.IsSuccessStatusCode)
        {
            var body = await loginRes.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Login başarısız (email={email}, status={loginRes.StatusCode}): {body}"
            );
        }

        var data = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, object>>(_jsonOpts);

        if (data == null || !data.ContainsKey("data"))
        {
            var body = await loginRes.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Login response'unda 'data' anahtarı bulunamadı. Response: {body}"
            );
        }

        var dataObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            data["data"].ToString()!,
            _jsonOpts
        );

        if (dataObj == null || !dataObj.ContainsKey("token"))
            throw new InvalidOperationException("Login response'unda 'token' bulunamadı.");

        return dataObj["token"].ToString()!;
    }
}
