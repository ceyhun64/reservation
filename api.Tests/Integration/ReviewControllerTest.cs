using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class ReviewControllerTests
{
    private async Task<HttpClient> CreateAuthenticatedClient(string role = "Receiver")
    {
        var client = TestFactory.CreateClient();
        var token = await TestFactory.GetTokenAsync(client, role: role);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // ── GET BY PROVIDER ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetByProvider_ShouldReturn200()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/reviews/provider/1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                appointmentId = 1,
                rating = 5,
                comment = "Harika!",
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn404_WhenAppointmentNotExists()
    {
        var client = await CreateAuthenticatedClient("Receiver");
        var response = await client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                appointmentId = 9999,
                rating = 5,
                comment = "Test",
            }
        );
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── REPLY ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Reply_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PatchAsJsonAsync(
            "/api/reviews/1/reply",
            new { reply = "Teşekkürler!" }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Reply_ShouldReturn404_WhenNotExists()
    {
        var client = await CreateAuthenticatedClient("Provider");
        var response = await client.PatchAsJsonAsync(
            "/api/reviews/9999/reply",
            new { reply = "Cevap" }
        );
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── HIDE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Hide_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PatchAsJsonAsync("/api/reviews/1/hide", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Hide_ShouldReturn404_WhenNotExists()
    {
        var client = await CreateAuthenticatedClient("Admin");
        var response = await client.PatchAsJsonAsync("/api/reviews/9999/hide", new { });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
