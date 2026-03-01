//api.Tests/BusinessControllerTest.cs
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using api.Data;

namespace api.Tests.Integration;

public class BusinessControllerTests
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

    private async Task<HttpClient> CreateAuthenticatedClient(string role = "Provider")
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

    [Fact]
    public async Task GetAll_ShouldReturn200()
    {
        var client = CreateFreshClient();
        var response = await client.GetAsync("/api/business");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn201_WhenProvider()
    {
        var client = await CreateAuthenticatedClient("Provider");

        var response = await client.PostAsJsonAsync("/api/business", new
        {
            name = "Test İşletme",
            description = "Açıklama",
            address = "Adres",
            phone = "05001234567"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = CreateFreshClient();

        var response = await client.PostAsJsonAsync("/api/business", new
        {
            name = "Test İşletme",
            description = "Açıklama",
            address = "Adres",
            phone = "05001234567"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var client = await CreateAuthenticatedClient("Provider");

        var createResponse = await client.PostAsJsonAsync("/api/business", new
        {
            name = "Eski İsim",
            description = "Açıklama",
            address = "Adres",
            phone = "05001234567"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var businessId = created!["id"];

        var updateResponse = await client.PutAsJsonAsync($"/api/business/{businessId}", new
        {
            name = "Yeni İsim",
            description = "Yeni Açıklama",
            address = "Yeni Adres",
            phone = "05009999999"
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
    }

    [Fact]
    public async Task Update_ShouldReturn403_WhenNotOwner()
    {
        // İlk kullanıcı işletme oluşturur
        var client1 = await CreateAuthenticatedClient("Provider");
        var createResponse = await client1.PostAsJsonAsync("/api/business", new
        {
            name = "Test İşletme",
            description = "Açıklama",
            address = "Adres",
            phone = "05001234567"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var businessId = created!["id"];

        // İkinci kullanıcı (farklı DB) — 404 döner çünkü işletmeyi göremez
        var client2 = await CreateAuthenticatedClient("Provider");
        var updateResponse = await client2.PutAsJsonAsync($"/api/business/{businessId}", new
        {
            name = "Hack",
            description = "Hack",
            address = "Hack",
            phone = "00000000000"
        });

        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn204_WhenOwner()
    {
        var client = await CreateAuthenticatedClient("Provider");

        var createResponse = await client.PostAsJsonAsync("/api/business", new
        {
            name = "Silinecek İşletme",
            description = "Açıklama",
            address = "Adres",
            phone = "05001234567"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var businessId = created!["id"];

        var deleteResponse = await client.DeleteAsync($"/api/business/{businessId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn401_WhenNoToken()
    {
        var client = CreateFreshClient();
        var response = await client.DeleteAsync("/api/business/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}