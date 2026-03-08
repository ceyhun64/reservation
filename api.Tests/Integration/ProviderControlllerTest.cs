using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class ProviderControllerTests
{
    private async Task<HttpClient> CreateProviderClient()
    {
        var client = TestFactory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";
        await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test Provider",
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
        // YENİ — case-insensitive
        var opts = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };
        var data = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, object>>(opts);
        var dataObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            data!["data"].ToString()!,
            opts
        );
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            dataObj!["token"].ToString()
        );
        return client;
    }

    private async Task<(HttpClient client, int providerId)> CreateProviderWithProfile()
    {
        var client = await CreateProviderClient();
        var res = await client.PostAsJsonAsync(
            "/api/providers",
            new
            {
                title = "Uzman Kuaför",
                bio = "10 yıllık deneyim",
                acceptsOnlineBooking = true,
            }
        );
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var created = await res.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var dataObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            created!["data"].ToString()!
        );
        var providerId = int.Parse(dataObj!["id"].ToString()!);
        return (client, providerId);
    }

    // ── SEARCH ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Search_ShouldReturn200()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/providers");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Search_ShouldReturn200_WithKeyword()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/providers?keyword=kuafor");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET BY ID ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/providers/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var (_, providerId) = await CreateProviderWithProfile();
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync($"/api/providers/{providerId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET ME ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetMe_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/providers/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_ShouldReturn200_WhenProfileExists()
    {
        var (client, _) = await CreateProviderWithProfile();
        var response = await client.GetAsync("/api/providers/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_ShouldReturn404_WhenNoProfile()
    {
        var client = await CreateProviderClient(); // profil oluşturmadı
        var response = await client.GetAsync("/api/providers/me");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var client = await CreateProviderClient();
        var response = await client.PostAsJsonAsync(
            "/api/providers",
            new
            {
                title = "Uzman",
                bio = "Bio",
                acceptsOnlineBooking = true,
            }
        );
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/providers",
            new
            {
                title = "Uzman",
                bio = "Bio",
                acceptsOnlineBooking = true,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenProfileAlreadyExists()
    {
        var (client, _) = await CreateProviderWithProfile();
        var response = await client.PostAsJsonAsync(
            "/api/providers",
            new
            {
                title = "Tekrar",
                bio = "Bio",
                acceptsOnlineBooking = false,
            }
        );
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ShouldReturn200_WhenOwner()
    {
        var (client, providerId) = await CreateProviderWithProfile();
        var response = await client.PutAsJsonAsync(
            $"/api/providers/{providerId}",
            new
            {
                title = "Güncel Başlık",
                bio = "Güncel bio",
                acceptsOnlineBooking = false,
            }
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Update_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PutAsJsonAsync(
            "/api/providers/1",
            new
            {
                title = "Başlık",
                bio = "Bio",
                acceptsOnlineBooking = true,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET SERVICES ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetServices_ShouldReturn200()
    {
        var (_, providerId) = await CreateProviderWithProfile();
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync($"/api/providers/{providerId}/services");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
