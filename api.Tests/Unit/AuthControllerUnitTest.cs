using api.Controllers;
using api.Data;
using api.DTOs;
using api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

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

    private AuthController CreateController(AppDbContext db)
    {
        var emailMock = new Mock<IEmailService>();
        emailMock
            .Setup(e =>
                e.SendWelcomeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
            )
            .Returns(Task.CompletedTask);
        emailMock
            .Setup(e => e.SendAppointmentCreatedAsync(It.IsAny<AppointmentEmailDto>()))
            .Returns(Task.CompletedTask);
        emailMock
            .Setup(e =>
                e.SendAppointmentStatusChangedAsync(
                    It.IsAny<AppointmentEmailDto>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>()
                )
            )
            .Returns(Task.CompletedTask);

        var cacheMock = new Mock<ICacheService>();
        cacheMock
            .Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);
        cacheMock.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync((string?)null);
        cacheMock.Setup(c => c.RemoveAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        var twoFactorMock = new Mock<ITwoFactorService>();
        twoFactorMock.Setup(t => t.GenerateSecret()).Returns("TESTSECRET");
        twoFactorMock
            .Setup(t => t.GetQrCodeUri(It.IsAny<string>(), It.IsAny<string>()))
            .Returns("otpauth://test");
        twoFactorMock
            .Setup(t => t.VerifyCode(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        var controller = new AuthController(
            db,
            CreateConfig(),
            emailMock.Object,
            cacheMock.Object,
            twoFactorMock.Object
        );
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext(),
        };
        return controller;
    }

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    [Fact]
    public async Task Register_ShouldReturn200_WhenValidData()
    {
        var result = await CreateController(CreateDb())
            .Register(
                new RegisterDto("Test User", "test@test.com", "Test123!", "5551234567", "Receiver")
            );
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Register_ShouldReturn400_WhenEmailAlreadyExists()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        var dto = new RegisterDto(
            "Test User",
            "dup@test.com",
            "Test123!",
            "5551234567",
            "Receiver"
        );
        await controller.Register(dto);
        var result = await controller.Register(dto);
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Register_ShouldHashPassword()
    {
        var db = CreateDb();
        await CreateController(db)
            .Register(
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
        await CreateController(db)
            .Register(
                new RegisterDto("Test User", "save@test.com", "Test123!", "5551234567", "Receiver")
            );
        Assert.Equal(1, db.Users.Count());
        Assert.Equal("save@test.com", db.Users.First().Email);
    }

    [Fact]
    public async Task Login_ShouldReturnToken_WhenValidCredentials()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        await controller.Register(
            new RegisterDto("Test User", "login@test.com", "Test123!", "5551234567", "Receiver")
        );
        var result = await controller.Login(new LoginDto("login@test.com", "Test123!"));
        var ok = Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenWrongPassword()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        await controller.Register(
            new RegisterDto("Test User", "user@test.com", "Test123!", "5551234567", "Receiver")
        );
        var result = await controller.Login(new LoginDto("user@test.com", "WrongPass!"));
        Assert.IsType<UnauthorizedObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Login_ShouldReturn401_WhenEmailNotExists()
    {
        var result = await CreateController(CreateDb())
            .Login(new LoginDto("noone@test.com", "Test123!"));
        Assert.IsType<UnauthorizedObjectResult>(Unwrap(result));
    }
}
