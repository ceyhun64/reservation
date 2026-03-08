using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class NotificationControllerTests
{
    private async Task<HttpClient> CreateAuthenticatedClient(string role = "Receiver")
    {
        var client = TestFactory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";
        await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Test User",
            email,
            password = "Test123!",
            phone = "5551234567",
            role,
        });
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "Test123!" });
        var data = await loginRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var dataObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(data!["data"].ToString()!);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", dataObj!["token"].ToString());
        return client;
    }

    // ── GET ALL ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/notifications");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_ShouldReturn200_WhenAuthenticated()
    {
        var client = await CreateAuthenticatedClient();
        var response = await client.GetAsync("/api/notifications");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_ShouldReturn200_WithUnreadOnlyFilter()
    {
        var client = await CreateAuthenticatedClient();
        var response = await client.GetAsync("/api/notifications?unreadOnly=true");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── MARK READ ────────────────────────────────────────────────────────────

    [Fact]
    public async Task MarkRead_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PatchAsJsonAsync("/api/notifications/1/read", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MarkRead_ShouldReturn404_WhenNotExists()
    {
        var client = await CreateAuthenticatedClient();
        var response = await client.PatchAsJsonAsync("/api/notifications/9999/read", new { });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── MARK ALL READ ────────────────────────────────────────────────────────

    [Fact]
    public async Task MarkAllRead_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PatchAsJsonAsync("/api/notifications/read-all", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MarkAllRead_ShouldReturn200_WhenAuthenticated()
    {
        var client = await CreateAuthenticatedClient();
        var response = await client.PatchAsJsonAsync("/api/notifications/read-all", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}