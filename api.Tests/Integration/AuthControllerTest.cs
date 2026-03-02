//api.Tests/AuthControllerTest.cs
using System.Net;
using System.Net.Http.Json;
using api.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace api.Tests.Integration;

public class AuthControllerTests
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

    [Fact]
    public async Task Register_ShouldReturn200_WhenValidData()
    {
        var client = CreateFreshClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test User",
                email = "test@test.com",
                password = "Test123!",
                role = "Receiver",
            }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Register_ShouldReturn400_WhenEmailAlreadyExists()
    {
        // Aynı client → aynı DB
        var client = CreateFreshClient();

        var data = new
        {
            fullName = "Test User",
            email = "duplicate@test.com",
            password = "Test123!",
            role = "Receiver",
        };

        var first = await client.PostAsJsonAsync("/api/auth/register", data);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/auth/register", data);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Login_ShouldReturnToken_WhenValidCredentials()
    {
        // Aynı client → Register ve Login aynı DB'de
        var client = CreateFreshClient();

        var register = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test User",
                email = "login@test.com",
                password = "Test123!",
                role = "Receiver",
            }
        );
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "login@test.com", password = "Test123!" }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(result!["token"]);
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenWrongPassword()
    {
        var client = CreateFreshClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "notexist@test.com", password = "WrongPass!" }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
