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
    private async Task<HttpClient> CreateReceiverClient()
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
                role = "Receiver",
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
        return client;
    }

    [Fact]
    public async Task GetMine_ShouldReturn200_WhenAuthenticated()
    {
        var client = await CreateReceiverClient();
        var response = await client.GetAsync("/api/appointments/my");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMine_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/appointments/my");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/appointments",
            new
            {
                providerId = 1,
                serviceId = 1,
                timeSlotId = 1,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenInvalidSlot()
    {
        var client = await CreateReceiverClient();
        var response = await client.PostAsJsonAsync(
            "/api/appointments",
            new
            {
                providerId = 1,
                serviceId = 1,
                timeSlotId = 9999,
            }
        );
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
