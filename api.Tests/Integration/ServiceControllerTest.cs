using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class ServiceControllerTests
{
    private async Task<HttpClient> CreateProviderClient()
    {
        var client = TestFactory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";
        await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test",
                email,
                password = "Test123!",
                phone = "5551234567",
                role = "Provider",
            }
        );
        var loginRes = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email, password = "Test123!" }
        );
        var data = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var dataObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            data!["data"].ToString()!
        );
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            dataObj!["token"].ToString()
        );
        await client.PostAsJsonAsync(
            "/api/providers",
            new
            {
                title = "Test Provider",
                bio = "Bio",
                acceptsOnlineBooking = true,
            }
        );
        return client;
    }

    [Fact]
    public async Task GetAll_ShouldReturn200()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/services");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/services/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/services",
            new
            {
                name = "H",
                description = "D",
                price = 100.0,
                durationMinutes = 30,
                categoryId = 1,
                businessId = 1,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.DeleteAsync("/api/services/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}


