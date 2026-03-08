using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class TimeSlotControllerTests
{
    private async Task<(HttpClient client, int providerId)> CreateProviderWithProfile()
    {
        var client = TestFactory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";
        await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Provider",
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

        var providerRes = await client.PostAsJsonAsync(
            "/api/providers",
            new
            {
                title = "Test Provider",
                bio = "Bio",
                acceptsOnlineBooking = true,
            }
        );
        var providerData = await providerRes.Content.ReadFromJsonAsync<
            Dictionary<string, object>
        >();
        var providerObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            providerData!["data"].ToString()!
        );
        var providerId = int.Parse(providerObj!["id"].ToString()!);

        return (client, providerId);
    }

    // ── GET AVAILABLE ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailable_ShouldReturn200()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/timeslots/provider/1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAvailable_ShouldReturn200_WithDate()
    {
        var client = TestFactory.CreateClient();
        var date = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd");
        var response = await client.GetAsync($"/api/timeslots/provider/1?date={date}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var start = DateTime.UtcNow.AddDays(2);
        var response = await client.PostAsJsonAsync(
            "/api/timeslots/provider/1",
            new { startTime = start, endTime = start.AddHours(1) }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn200_WhenProvider()
    {
        var (client, providerId) = await CreateProviderWithProfile();
        var start = DateTime.UtcNow.AddDays(3);
        var response = await client.PostAsJsonAsync(
            $"/api/timeslots/provider/{providerId}",
            new { startTime = start, endTime = start.AddHours(1) }
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenPastDate()
    {
        var (client, providerId) = await CreateProviderWithProfile();
        var past = DateTime.UtcNow.AddDays(-1);
        var response = await client.PostAsJsonAsync(
            $"/api/timeslots/provider/{providerId}",
            new { startTime = past, endTime = past.AddHours(1) }
        );
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── CREATE BULK ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBulk_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/timeslots/provider/1/bulk",
            new
            {
                date = DateTime.UtcNow.AddDays(5).Date,
                workStart = "09:00:00",
                workEnd = "17:00:00",
                slotMinutes = 60,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateBulk_ShouldReturn200_WhenProvider()
    {
        var (client, providerId) = await CreateProviderWithProfile();
        var response = await client.PostAsJsonAsync(
            $"/api/timeslots/provider/{providerId}/bulk",
            new
            {
                date = DateTime.UtcNow.AddDays(7).Date,
                workStart = "09:00:00",
                workEnd = "12:00:00",
                slotMinutes = 60,
            }
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── BLOCK ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Block_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PatchAsJsonAsync("/api/timeslots/1/block", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Block_ShouldReturn404_WhenSlotNotExists()
    {
        var (client, _) = await CreateProviderWithProfile();
        var response = await client.PatchAsJsonAsync("/api/timeslots/9999/block", new { });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.DeleteAsync("/api/timeslots/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var (client, _) = await CreateProviderWithProfile();
        var response = await client.DeleteAsync("/api/timeslots/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
