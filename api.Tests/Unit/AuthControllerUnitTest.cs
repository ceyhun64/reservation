//api.Tests/Unit/AuthControllerUnitTests.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using api.Controllers;
using api.Data;
using api.DTOs;

namespace api.Tests.Unit;

public class AuthControllerUnitTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private IConfiguration CreateConfig()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Secret", "super_secret_key_for_testing_1234567890" },
            { "Jwt:Issuer", "testissuer" },
            { "Jwt:Audience", "testaudience" },
            { "Jwt:ExpireMinutes", "60" }
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    // ──────────────── REGISTER ────────────────

    [Fact]
    public async Task Register_ShouldReturn200_WhenValidData()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        var result = await controller.Register(new RegisterDto
        {
            FullName = "Test User",
            Email = "test@test.com",
            Password = "Test123!",
            Role = "Receiver"
        });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Register_ShouldReturn400_WhenEmailAlreadyExists()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        var dto = new RegisterDto
        {
            FullName = "Test User",
            Email = "duplicate@test.com",
            Password = "Test123!",
            Role = "Receiver"
        };

        await controller.Register(dto);
        var result = await controller.Register(dto);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ──────────────── LOGIN ────────────────

    [Fact]
    public async Task Login_ShouldReturnToken_WhenValidCredentials()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        await controller.Register(new RegisterDto
        {
            FullName = "Test User",
            Email = "login@test.com",
            Password = "Test123!",
            Role = "Receiver"
        });

        var result = await controller.Login(new LoginDto
        {
            Email = "login@test.com",
            Password = "Test123!"
        });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);

        // token alanının varlığını kontrol et
        var value = ok.Value!;
        var token = value.GetType().GetProperty("token")?.GetValue(value)?.ToString();
        Assert.False(string.IsNullOrEmpty(token));
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenWrongPassword()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        await controller.Register(new RegisterDto
        {
            FullName = "Test User",
            Email = "user@test.com",
            Password = "Test123!",
            Role = "Receiver"
        });

        var result = await controller.Login(new LoginDto
        {
            Email = "user@test.com",
            Password = "WrongPassword!"
        });

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenEmailNotExists()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        var result = await controller.Login(new LoginDto
        {
            Email = "notexist@test.com",
            Password = "Test123!"
        });

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Register_ShouldHashPassword()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        await controller.Register(new RegisterDto
        {
            FullName = "Test User",
            Email = "hash@test.com",
            Password = "Test123!",
            Role = "Receiver"
        });

        var user = db.Users.First();
        Assert.NotEqual("Test123!", user.PasswordHash);
        Assert.StartsWith("$2", user.PasswordHash); // BCrypt hash formatı
    }

    [Fact]
    public async Task Register_ShouldSaveUserToDatabase()
    {
        var db = CreateInMemoryDb();
        var config = CreateConfig();
        var controller = new AuthController(db, config);

        await controller.Register(new RegisterDto
        {
            FullName = "Test User",
            Email = "save@test.com",
            Password = "Test123!",
            Role = "Receiver"
        });

        Assert.Equal(1, db.Users.Count());
        Assert.Equal("save@test.com", db.Users.First().Email);
    }
}