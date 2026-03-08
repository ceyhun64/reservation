using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class CategoryControllerTest
{
    private async Task<HttpClient> CreateAdminClient()
    {
        var client = TestFactory.CreateClient();
        var token = await TestFactory.GetTokenAsync(client, role: "Admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // ── GET ALL ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ShouldReturn200()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/categories");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET BY ID ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var client = TestFactory.CreateClient();
        var response = await client.GetAsync("/api/categories/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var client = await CreateAdminClient();
        var createRes = await client.PostAsJsonAsync(
            "/api/categories",
            new
            {
                name = "Test Kategori",
                description = "Açıklama",
                displayOrder = 1,
            }
        );
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var created = await createRes.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var dataObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            created!["data"].ToString()!
        );
        var id = dataObj!["id"].ToString();

        var response = await TestFactory.CreateClient().GetAsync($"/api/categories/{id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldReturn201_WhenAdmin()
    {
        var client = await CreateAdminClient();
        var response = await client.PostAsJsonAsync(
            "/api/categories",
            new
            {
                name = "Güzellik",
                description = "Güzellik kategorisi",
                displayOrder = 1,
            }
        );
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/categories",
            new
            {
                name = "Test",
                description = "D",
                displayOrder = 1,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.PutAsJsonAsync(
            "/api/categories/1",
            new
            {
                name = "Updated",
                description = "D",
                displayOrder = 1,
            }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ShouldReturn401_WhenNoToken()
    {
        var client = TestFactory.CreateClient();
        var response = await client.DeleteAsync("/api/categories/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var client = await CreateAdminClient();
        var response = await client.DeleteAsync("/api/categories/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
