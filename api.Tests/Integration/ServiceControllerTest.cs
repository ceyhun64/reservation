//api.Tests/ServiceControllerTest.cs
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using api.Data;

namespace api.Tests.Integration;

public class ServiceControllerTests
{
    private HttpClient CreateFreshClient()
    {
        var dbName = Guid.NewGuid().ToString();

        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptors = services.Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                        d.ServiceType == typeof(AppDbContext) ||
                        (d.ServiceType.FullName != null && d.ServiceType.FullName.Contains("AppDbContext"))
                    ).ToList();

                    foreach (var d in descriptors)
                        services.Remove(d);

                    services.AddDbContext<AppDbContext>(opt =>
                        opt.UseInMemoryDatabase(dbName));
                });
            });

        return factory.CreateClient();
    }

    private async Task<HttpClient> CreateAuthenticatedClient(string role = "BusinessOwner")
    {
        var client = CreateFreshClient();
        var email = $"{Guid.NewGuid()}@test.com";

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Test Owner",
            email = email,
            password = "Test123!",
            role = role
        });

        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = email,
            password = "Test123!"
        });

        var loginData = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", loginData!["token"]);

        return client;
    }

    // İşletme + hizmet oluşturup businessId ve serviceId döner
    private async Task<(HttpClient client, int businessId, int serviceId)> CreateClientWithBusinessAndService()
    {
        var client = await CreateAuthenticatedClient("BusinessOwner");

        var businessRes = await client.PostAsJsonAsync("/api/business", new
        {
            name = "Test İşletme",
            description = "Açıklama",
            address = "Adres",
            phone = "05001234567"
        });
        var business = await businessRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var businessId = int.Parse(business!["id"].ToString()!);

        var serviceRes = await client.PostAsJsonAsync("/api/service", new
        {
            name = "Test Hizmet",
            description = "Hizmet Açıklama",
            price = 100.0,
            durationMinutes = 30,
            businessId = businessId
        });
        var service = await serviceRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var serviceId = int.Parse(service!["id"].ToString()!);

        return (client, businessId, serviceId);
    }

    [Fact]
    public async Task GetAll_ShouldReturn200()
    {
        var client = CreateFreshClient();
        var response = await client.GetAsync("/api/service");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var (client, _, serviceId) = await CreateClientWithBusinessAndService();
        var response = await client.GetAsync($"/api/service/{serviceId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var client = CreateFreshClient();
        var response = await client.GetAsync("/api/service/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetByBusiness_ShouldReturn200()
    {
        var (client, businessId, _) = await CreateClientWithBusinessAndService();
        var response = await client.GetAsync($"/api/service/business/{businessId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn201_WhenBusinessOwner()
    {
        var (client, businessId, _) = await CreateClientWithBusinessAndService();

        var response = await client.PostAsJsonAsync("/api/service", new
        {
            name = "Yeni Hizmet",
            description = "Açıklama",
            price = 150.0,
            durationMinutes = 45,
            businessId = businessId
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = CreateFreshClient();

        var response = await client.PostAsJsonAsync("/api/service", new
        {
            name = "Hizmet",
            description = "Açıklama",
            price = 100.0,
            durationMinutes = 30,
            businessId = 1
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenBusinessNotExists()
    {
        var client = await CreateAuthenticatedClient("BusinessOwner");

        var response = await client.PostAsJsonAsync("/api/service", new
        {
            name = "Hizmet",
            description = "Açıklama",
            price = 100.0,
            durationMinutes = 30,
            businessId = 9999
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var (client, _, serviceId) = await CreateClientWithBusinessAndService();

        var response = await client.PutAsJsonAsync($"/api/service/{serviceId}", new
        {
            name = "Güncel Hizmet",
            description = "Güncel Açıklama",
            price = 200.0,
            durationMinutes = 60,
            businessId = 1
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn204_WhenOwner()
    {
        var (client, _, serviceId) = await CreateClientWithBusinessAndService();
        var response = await client.DeleteAsync($"/api/service/{serviceId}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn401_WhenNoToken()
    {
        var client = CreateFreshClient();
        var response = await client.DeleteAsync("/api/service/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}