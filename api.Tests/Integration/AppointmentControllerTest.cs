//api.Tests/AppointmentControllerTest.cs
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using api.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace api.Tests.Integration;

public class AppointmentControllerTests
{
    private HttpClient CreateFreshClient()
    {
        var dbName = Guid.NewGuid().ToString();

        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptors = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                        || d.ServiceType == typeof(AppDbContext)
                        || (
                            d.ServiceType.FullName != null
                            && d.ServiceType.FullName.Contains("AppDbContext")
                        )
                    )
                    .ToList();

                foreach (var d in descriptors)
                    services.Remove(d);

                services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase(dbName));
            });
        });

        return factory.CreateClient();
    }

    private async Task<HttpClient> CreateAuthenticatedClient(string role = "Receiver")
    {
        var client = CreateFreshClient();
        var email = $"{Guid.NewGuid()}@test.com";

        await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test User",
                email = email,
                password = "Test123!",
                role = role,
            }
        );

        var loginRes = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = email, password = "Test123!" }
        );

        var loginData = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            loginData!["token"]
        );

        return client;
    }

    // Müşteri + işletme sahibi aynı DB'de, businessId ve serviceId döner
    private async Task<(
        HttpClient receiverClient,
        HttpClient ownerClient,
        int businessId,
        int serviceId
    )> CreateFullSetup()
    {
        var dbName = Guid.NewGuid().ToString();

        async Task<HttpClient> MakeClient(string role)
        {
            var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptors = services
                        .Where(d =>
                            d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                            || d.ServiceType == typeof(AppDbContext)
                            || (
                                d.ServiceType.FullName != null
                                && d.ServiceType.FullName.Contains("AppDbContext")
                            )
                        )
                        .ToList();

                    foreach (var d in descriptors)
                        services.Remove(d);

                    services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase(dbName));
                });
            });

            var client = factory.CreateClient();
            var email = $"{Guid.NewGuid()}@test.com";

            await client.PostAsJsonAsync(
                "/api/auth/register",
                new
                {
                    fullName = "Test User",
                    email = email,
                    password = "Test123!",
                    role = role,
                }
            );

            var loginRes = await client.PostAsJsonAsync(
                "/api/auth/login",
                new { email = email, password = "Test123!" }
            );

            var loginData = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, string>>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                loginData!["token"]
            );

            return client;
        }

        var ownerClient = await MakeClient("Provider");
        var receiverClient = await MakeClient("Receiver");

        var businessRes = await ownerClient.PostAsJsonAsync(
            "/api/business",
            new
            {
                name = "Test İşletme",
                description = "Açıklama",
                address = "Adres",
                phone = "05001234567",
            }
        );
        var business = await businessRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var businessId = int.Parse(business!["id"].ToString()!);

        var serviceRes = await ownerClient.PostAsJsonAsync(
            "/api/service",
            new
            {
                name = "Test Hizmet",
                description = "Açıklama",
                price = 100.0,
                durationMinutes = 30,
                businessId = businessId,
            }
        );
        var service = await serviceRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var serviceId = int.Parse(service!["id"].ToString()!);

        return (receiverClient, ownerClient, businessId, serviceId);
    }

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var (receiverClient, _, _, serviceId) = await CreateFullSetup();

        var response = await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "Test not",
            }
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = CreateFreshClient();

        var response = await client.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = 1,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "",
            }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenServiceNotExists()
    {
        var receiverClient = await CreateAuthenticatedClient("Receiver");

        var response = await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = 9999,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "",
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenTimeConflict()
    {
        var (receiverClient, _, _, serviceId) = await CreateFullSetup();

        var startTime = DateTime.UtcNow.AddDays(1);

        await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = startTime,
                notes = "İlk randevu",
            }
        );

        // Aynı saatte ikinci randevu
        var response = await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = startTime,
                notes = "Çakışan randevu",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetMyAppointments_ShouldReturn200()
    {
        var (receiverClient, _, _, serviceId) = await CreateFullSetup();

        await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "",
            }
        );

        var response = await receiverClient.GetAsync("/api/appointment");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Cancel_ShouldReturn200_WhenOwner()
    {
        var (receiverClient, _, _, serviceId) = await CreateFullSetup();

        var createRes = await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "",
            }
        );

        var created = await createRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var appointmentId = int.Parse(created!["id"].ToString()!);

        var response = await receiverClient.PutAsync(
            $"/api/appointment/{appointmentId}/cancel",
            null
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Confirm_ShouldReturn200_WhenProvider()
    {
        var (receiverClient, ownerClient, _, serviceId) = await CreateFullSetup();

        var createRes = await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "",
            }
        );

        var created = await createRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var appointmentId = int.Parse(created!["id"].ToString()!);

        var response = await ownerClient.PutAsync(
            $"/api/appointment/{appointmentId}/confirm",
            null
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Confirm_ShouldReturn401_WhenNoToken()
    {
        var client = CreateFreshClient();
        var response = await client.PutAsync("/api/appointment/1/confirm", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetByBusiness_ShouldReturn200_WhenOwner()
    {
        var (receiverClient, ownerClient, businessId, serviceId) = await CreateFullSetup();

        await receiverClient.PostAsJsonAsync(
            "/api/appointment",
            new
            {
                serviceId = serviceId,
                startTime = DateTime.UtcNow.AddDays(1),
                notes = "",
            }
        );

        var response = await ownerClient.GetAsync($"/api/appointment/business/{businessId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
