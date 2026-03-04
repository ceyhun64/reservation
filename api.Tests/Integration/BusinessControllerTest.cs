using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class BusinessControllerTests
{
    private async Task<HttpClient> CreateAuthenticatedClient(string role = "Provider")
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
                role,
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

        // Provider profili oluştur
        if (role == "Provider")
        {
            await client.PostAsJsonAsync(
                "/api/providers",
                new
                {
                    title = "Test Provider",
                    bio = "Bio",
                    acceptsOnlineBooking = true,
                }
            );
        }
        return client;
    }

    [Fact]
    public async Task GetAll_ShouldReturn200()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/businesses");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn201_WhenProvider()
    {
        var client = await CreateAuthenticatedClient("Provider");
        var response = await client.PostAsJsonAsync(
            "/api/businesses",
            new
            {
                name = "Test İşletme",
                description = "Açıklama",
                address = "Adres",
                city = "İstanbul",
                phone = "5001234567",
            }
        );
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/businesses",
            new
            {
                name = "Test",
                description = "D",
                address = "A",
                city = "C",
                phone = "1",
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/businesses/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.DeleteAsync("/api/businesses/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
