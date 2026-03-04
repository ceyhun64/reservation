using api.Controllers;
using api.Data;
using api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace api.Tests.Unit;

public class AuthControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    { "Jwt:Secret", "super_secret_key_for_testing_1234567890!!" },
                    { "Jwt:Issuer", "TestIssuer" },
                    { "Jwt:Audience", "TestAudience" },
                    { "Jwt:ExpireMinutes", "60" },
                }
            )
            .Build();

    // ── REGISTER ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ShouldReturn200_WhenValidData()
    {
        var controller = new AuthController(CreateDb(), CreateConfig());
        var result = await controller.Register(
            new RegisterDto("Test User", "test@test.com", "Test123!", "5551234567", "Receiver")
        );
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Register_ShouldReturn400_WhenEmailAlreadyExists()
    {
        var db = CreateDb();
        var controller = new AuthController(db, CreateConfig());
        var dto = new RegisterDto(
            "Test User",
            "dup@test.com",
            "Test123!",
            "5551234567",
            "Receiver"
        );
        await controller.Register(dto);
        var result = await controller.Register(dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Register_ShouldHashPassword()
    {
        var db = CreateDb();
        var controller = new AuthController(db, CreateConfig());
        await controller.Register(
            new RegisterDto("Test User", "hash@test.com", "Test123!", "5551234567", "Receiver")
        );
        var user = db.Users.First();
        Assert.NotEqual("Test123!", user.PasswordHash);
        Assert.StartsWith("$2", user.PasswordHash);
    }

    [Fact]
    public async Task Register_ShouldSaveUserToDatabase()
    {
        var db = CreateDb();
        var controller = new AuthController(db, CreateConfig());
        await controller.Register(
            new RegisterDto("Test User", "save@test.com", "Test123!", "5551234567", "Receiver")
        );
        Assert.Equal(1, db.Users.Count());
        Assert.Equal("save@test.com", db.Users.First().Email);
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ShouldReturnToken_WhenValidCredentials()
    {
        var db = CreateDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);
        await controller.Register(
            new RegisterDto("Test User", "login@test.com", "Test123!", "5551234567", "Receiver")
        );
        var result = await controller.Login(new LoginDto("login@test.com", "Test123!"));
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenWrongPassword()
    {
        var db = CreateDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);
        await controller.Register(
            new RegisterDto("Test User", "user@test.com", "Test123!", "5551234567", "Receiver")
        );
        var result = await controller.Login(new LoginDto("user@test.com", "WrongPass!"));
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenEmailNotExists()
    {
        var controller = new AuthController(CreateDb(), CreateConfig());
        var result = await controller.Login(new LoginDto("noone@test.com", "Test123!"));
        Assert.IsType<UnauthorizedObjectResult>(result);
    }
}
