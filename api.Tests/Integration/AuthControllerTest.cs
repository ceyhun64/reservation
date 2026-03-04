using System.Net;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class AuthControllerTests
{
    [Fact]
    public async Task Register_ShouldReturn200_WhenValidData()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test User",
                email = "test@test.com",
                password = "Test123!",
                phone = "5551234567",
                role = "Receiver",
            }
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Register_ShouldReturn400_WhenEmailAlreadyExists()
    {
        var client = TestFactory.CreateClient();
        var data = new
        {
            fullName = "Test",
            email = "dup@test.com",
            password = "Test123!",
            phone = "5551234567",
            role = "Receiver",
        };
        await client.PostAsJsonAsync("/api/auth/register", data);
        var result = await client.PostAsJsonAsync("/api/auth/register", data);
        Assert.Equal(HttpStatusCode.BadRequest, result.StatusCode);
    }

    [Fact]
    public async Task Login_ShouldReturnToken_WhenValidCredentials()
    {
        var client = TestFactory.CreateClient();
        await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                fullName = "Test",
                email = "login@test.com",
                password = "Test123!",
                phone = "5551234567",
                role = "Receiver",
            }
        );
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "login@test.com", password = "Test123!" }
        );
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(result!["data"]);
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenWrongPassword()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "noone@test.com", password = "Wrong!" }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
