using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace api.Tests.Unit;

public class CategoryControllerUnitTests
{
    private AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
        );

    private CategoryController CreateController(AppDbContext db, string role = "Admin")
    {
        var cacheMock = new Mock<ICacheService>();
        cacheMock
            .Setup(c => c.GetAsync<List<CategoryResponseDto>>(It.IsAny<string>()))
            .ReturnsAsync((List<CategoryResponseDto>?)null);
        cacheMock
            .Setup(c => c.GetAsync<CategoryResponseDto>(It.IsAny<string>()))
            .ReturnsAsync((CategoryResponseDto?)null);
        cacheMock
            .Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);
        cacheMock.Setup(c => c.RemoveAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
        cacheMock.Setup(c => c.RemoveByPrefixAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        var controller = new CategoryController(db, cacheMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, "1"),
                            new Claim(ClaimTypes.Role, role),
                        },
                        "test"
                    )
                ),
            },
        };
        return controller;
    }

    private async Task<int> SeedCategoryAsync(
        AppDbContext db,
        string name = "Test Kategori",
        int? parentId = null
    )
    {
        var category = new Category
        {
            Name = name,
            Slug = name.ToLower().Replace(" ", "-"),
            Description = "Test",
            ParentCategoryId = parentId,
            IsActive = true,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.Id;
    }

    private static IActionResult Unwrap<T>(ActionResult<T> result) =>
        result.Result ?? (IActionResult)new OkObjectResult(result.Value);

    [Fact]
    public async Task GetAll_ShouldReturn200_WithEmptyList()
    {
        var result = await CreateController(CreateDb()).GetAll();
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetAll_ShouldReturn200_WithCategories()
    {
        var db = CreateDb();
        await SeedCategoryAsync(db, "Güzellik");
        var result = await CreateController(db).GetAll();
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetById_ShouldReturn200_WhenExists()
    {
        var db = CreateDb();
        var id = await SeedCategoryAsync(db);
        var result = await CreateController(db).GetById(id);
        Assert.IsType<OkObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task GetById_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb()).GetById(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldReturn201_WhenValidData()
    {
        var result = await CreateController(CreateDb())
            .Create(new CategoryDto("Yeni", "Açıklama", null, null, 1));
        Assert.IsType<CreatedAtActionResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_ShouldSaveToDatabase()
    {
        var db = CreateDb();
        await CreateController(db).Create(new CategoryDto("Test", "Açıklama", null, null, 1));
        Assert.Equal(1, db.Categories.Count());
    }

    [Fact]
    public async Task Create_ShouldReturn400_WhenParentNotExists()
    {
        var result = await CreateController(CreateDb())
            .Create(new CategoryDto("Alt", "Açıklama", null, 9999, 1));
        Assert.IsType<BadRequestObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Create_WithValidParent_ShouldReturn201()
    {
        var db = CreateDb();
        var parentId = await SeedCategoryAsync(db, "Ana");
        var result = await CreateController(db)
            .Create(new CategoryDto("Alt", "Açıklama", null, parentId, 1));
        Assert.IsType<CreatedAtActionResult>(Unwrap(result));
    }

    [Fact]
    public async Task Update_ShouldReturn200_WhenExists()
    {
        var db = CreateDb();
        var id = await SeedCategoryAsync(db);
        var result = await CreateController(db)
            .Update(id, new CategoryDto("Güncel", "Yeni", null, null, 2));
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.Equal("Güncel", db.Categories.Find(id)!.Name);
    }

    [Fact]
    public async Task Update_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb())
            .Update(9999, new CategoryDto("X", "Y", null, null, 1));
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }

    [Fact]
    public async Task Delete_ShouldReturn200_WhenExists()
    {
        var db = CreateDb();
        var id = await SeedCategoryAsync(db);
        var result = await CreateController(db).Delete(id);
        Assert.IsType<OkObjectResult>(Unwrap(result));
        Assert.False(db.Categories.Find(id)!.IsActive);
    }

    [Fact]
    public async Task Delete_ShouldReturn404_WhenNotExists()
    {
        var result = await CreateController(CreateDb()).Delete(9999);
        Assert.IsType<NotFoundObjectResult>(Unwrap(result));
    }
}
