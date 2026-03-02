using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ProviderService> ProviderServices => Set<ProviderService>();
    public DbSet<TimeSlot> TimeSlots => Set<TimeSlot>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        // ── User ────────────────────────────────────────────────
        m.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // User → Provider (1-1)
        m.Entity<User>()
            .HasOne(u => u.ProviderProfile)
            .WithOne(p => p.User)
            .HasForeignKey<Provider>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // User → OwnedBusinesses
        m.Entity<User>()
            .HasMany(u => u.OwnedBusinesses)
            .WithOne(b => b.Owner)
            .HasForeignKey(b => b.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Category (self-referencing) ─────────────────────────
        m.Entity<Category>()
            .HasOne(c => c.ParentCategory)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        m.Entity<Category>().HasIndex(c => c.Slug).IsUnique();

        // ── Business → Provider ─────────────────────────────────
        m.Entity<Provider>()
            .HasOne(p => p.Business)
            .WithMany(b => b.Providers)
            .HasForeignKey(p => p.BusinessId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── ProviderService (composite PK) ──────────────────────
        m.Entity<ProviderService>().HasKey(ps => new { ps.ProviderId, ps.ServiceId });

        m.Entity<ProviderService>()
            .HasOne(ps => ps.Provider)
            .WithMany(p => p.ProviderServices)
            .HasForeignKey(ps => ps.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        m.Entity<ProviderService>()
            .HasOne(ps => ps.Service)
            .WithMany(s => s.ProviderServices)
            .HasForeignKey(ps => ps.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Service ─────────────────────────────────────────────
        m.Entity<Service>().Property(s => s.Price).HasColumnType("decimal(18,2)");

        m.Entity<Service>()
            .HasOne(s => s.Category)
            .WithMany(c => c.Services)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        m.Entity<Service>()
            .HasOne(s => s.Business)
            .WithMany(b => b.Services)
            .HasForeignKey(s => s.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Appointment ──────────────────────────────────────────
        m.Entity<Appointment>().Property(a => a.PricePaid).HasColumnType("decimal(18,2)");

        // Receiver → Appointments
        m.Entity<Appointment>()
            .HasOne(a => a.Receiver)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Provider → Appointments
        m.Entity<Appointment>()
            .HasOne(a => a.Provider)
            .WithMany(p => p.Appointments)
            .HasForeignKey(a => a.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Service → Appointments
        m.Entity<Appointment>()
            .HasOne(a => a.Service)
            .WithMany(s => s.Appointments)
            .HasForeignKey(a => a.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Appointment → TimeSlot (1-1)
        m.Entity<Appointment>()
            .HasOne(a => a.TimeSlot)
            .WithOne(ts => ts.Appointment)
            .HasForeignKey<Appointment>(a => a.TimeSlotId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Review ───────────────────────────────────────────────
        m.Entity<Review>()
            .HasOne(r => r.Appointment)
            .WithOne(a => a.Review)
            .HasForeignKey<Review>(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        m.Entity<Review>()
            .HasOne(r => r.Author)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        m.Entity<Review>()
            .HasOne(r => r.Provider)
            .WithMany(p => p.Reviews)
            .HasForeignKey(r => r.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bir randevuya sadece bir yorum
        m.Entity<Review>().HasIndex(r => r.AppointmentId).IsUnique();

        // ── Notification ─────────────────────────────────────────
        m.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── TimeSlot → Provider ─────────────────────────────────
        m.Entity<TimeSlot>()
            .HasOne(ts => ts.Provider)
            .WithMany(p => p.TimeSlots)
            .HasForeignKey(ts => ts.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Seed: Kök Kategoriler ─────────────────────────────────
        m.Entity<Category>()
            .HasData(
                new Category
                {
                    Id = 1,
                    Name = "Sağlık",
                    Slug = "saglik",
                    Description = "Tıbbi ve sağlık hizmetleri",
                    DisplayOrder = 1,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 2,
                    Name = "Güzellik",
                    Slug = "guzellik",
                    Description = "Güzellik ve bakım hizmetleri",
                    DisplayOrder = 2,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 3,
                    Name = "Spor & Fitness",
                    Slug = "spor-fitness",
                    Description = "Spor ve antrenman hizmetleri",
                    DisplayOrder = 3,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 4,
                    Name = "Eğlence",
                    Slug = "eglence",
                    Description = "Eğlence ve aktivite hizmetleri",
                    DisplayOrder = 4,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 5,
                    Name = "Eğitim",
                    Slug = "egitim",
                    Description = "Özel ders ve eğitim hizmetleri",
                    DisplayOrder = 5,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 6,
                    Name = "Hukuk & Danışmanlık",
                    Slug = "hukuk-danismanlik",
                    Description = "Profesyonel danışmanlık hizmetleri",
                    DisplayOrder = 6,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                // Alt kategoriler
                new Category
                {
                    Id = 10,
                    Name = "Klinik",
                    Slug = "klinik",
                    Description = "Poliklinik ve klinik hizmetleri",
                    DisplayOrder = 1,
                    ParentCategoryId = 1,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 11,
                    Name = "Diş Hekimi",
                    Slug = "dis-hekimi",
                    Description = "Diş sağlığı hizmetleri",
                    DisplayOrder = 2,
                    ParentCategoryId = 1,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 12,
                    Name = "Psikolog",
                    Slug = "psikolog",
                    Description = "Psikolojik destek hizmetleri",
                    DisplayOrder = 3,
                    ParentCategoryId = 1,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 13,
                    Name = "Fizyoterapi",
                    Slug = "fizyoterapi",
                    Description = "Fizyoterapi hizmetleri",
                    DisplayOrder = 4,
                    ParentCategoryId = 1,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 20,
                    Name = "Kuaför",
                    Slug = "kuafor",
                    Description = "Saç bakım hizmetleri",
                    DisplayOrder = 1,
                    ParentCategoryId = 2,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 21,
                    Name = "Makyaj",
                    Slug = "makyaj",
                    Description = "Makyaj hizmetleri",
                    DisplayOrder = 2,
                    ParentCategoryId = 2,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 22,
                    Name = "Nail Art",
                    Slug = "nail-art",
                    Description = "Tırnak bakımı ve nail art",
                    DisplayOrder = 3,
                    ParentCategoryId = 2,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 30,
                    Name = "Personal Trainer",
                    Slug = "personal-trainer",
                    Description = "Kişisel antrenör hizmetleri",
                    DisplayOrder = 1,
                    ParentCategoryId = 3,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 31,
                    Name = "Yoga",
                    Slug = "yoga",
                    Description = "Yoga dersleri",
                    DisplayOrder = 2,
                    ParentCategoryId = 3,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 40,
                    Name = "Escape Room",
                    Slug = "escape-room",
                    Description = "Escape room aktiviteleri",
                    DisplayOrder = 1,
                    ParentCategoryId = 4,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 41,
                    Name = "Bowling",
                    Slug = "bowling",
                    Description = "Bowling salonu rezervasyonu",
                    DisplayOrder = 2,
                    ParentCategoryId = 4,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Category
                {
                    Id = 42,
                    Name = "Oyun Salonu",
                    Slug = "oyun-salonu",
                    Description = "Oyun salonu rezervasyonu",
                    DisplayOrder = 3,
                    ParentCategoryId = 4,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
            );
    }
}
