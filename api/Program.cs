using System.Text;
using System.Text.Json.Serialization;
using api.Data;
using api.Hubs;
using api.Middleware;
using api.Repositories;
using api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();
DotNetEnv.Env.Load(); // ← en üste, builder'dan önce

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog(
    (ctx, services, cfg) =>
        cfg
            .ReadFrom.Configuration(ctx.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
);

// ── Controllers ───────────────────────────────────────────────────────────────
builder
    .Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// ── SignalR ───────────────────────────────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<INotificationService, NotificationService>();

// ── Redis Cache ───────────────────────────────────────────────────────────────
builder.Services.AddStackExchangeRedisCache(opt =>
    opt.Configuration = builder.Configuration["Redis:ConnectionString"]
);
builder.Services.AddScoped<ICacheService, RedisCacheService>();

// ── Repository / Unit of Work ─────────────────────────────────────────────────
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]!;

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero,
        };

        // SignalR WebSocket bağlantısı için JWT token query string'den okunur
        // (WebSocket başlık taşıyamaz, bu yüzden gerekli)
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

// ── Health Check ──────────────────────────────────────────────────────────────
builder
    .Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration["Redis:ConnectionString"]!);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(opt =>
{
    opt.RejectionStatusCode = 429;
    opt.AddFixedWindowLimiter(
        "fixed",
        cfg =>
        {
            cfg.Window = TimeSpan.FromMinutes(1);
            cfg.PermitLimit = 60;
            cfg.QueueLimit = 0;
        }
    );
    opt.AddFixedWindowLimiter(
        "auth",
        cfg =>
        {
            cfg.Window = TimeSpan.FromMinutes(1);
            cfg.PermitLimit = 10;
            cfg.QueueLimit = 0;
        }
    );
});

// ── FluentValidation ──────────────────────────────────────────────────────────
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Services bölümüne ekle
builder.Services.AddHostedService<ReminderBackgroundService>();

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>(); // ← bunu ekle

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins =
    builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(opt =>
    opt.AddPolicy(
        "WebApp",
        p => p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()
    )
);

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "Universal Appointment System API",
            Version = "v1",
            Description = "Evrensel Randevu Yonetim Platformu",
        }
    );

    c.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Token giriniz. Ornek: eyJhbGci...",
        }
    );

    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        }
    );
});

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Appointment API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging(opt =>
{
    opt.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});

app.UseCors("WebApp"); // ← CORS önce
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers().RequireRateLimiting("fixed");
app.MapHealthChecks("/health");
app.MapHub<NotificationHub>("/hubs/notifications"); // ← SignalR endpoint

// ── Seed ──────────────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (app.Environment.IsDevelopment())
    {
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync();
    }
    else
    {
        await db.Database.MigrateAsync();
    }

    try
    {
        await DataSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Seed sırasında hata oluştu!");
        throw;
    }
}

try
{
    app.Run();
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
