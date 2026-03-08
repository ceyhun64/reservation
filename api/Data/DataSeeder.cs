using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        string hash = BCrypt.Net.BCrypt.HashPassword("Test.123!");

        // ── 1. USERS ──────────────────────────────────────────────────────────
        // 3 kullanıcı: 1 Receiver, 1 Provider, 1 Admin
        var users = new List<User>
        {
            new()
            {
                Id = 1,
                FullName = "Ahmet Yılmaz",
                Email = "ahmet@example.com",
                PasswordHash = hash,
                Phone = "5301234001",
                Role = "Receiver",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
            new()
            {
                Id = 2,
                FullName = "Emre Şahin",
                Email = "emre@provider.com",
                PasswordHash = hash,
                Phone = "5301235001",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 3,
                FullName = "Admin Kullanıcı",
                Email = "admin@rezervo.com",
                PasswordHash = hash,
                Phone = "5301237001",
                Role = "Admin",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 1),
            },
        };
        await db.Users.AddRangeAsync(users);
        await db.SaveChangesAsync();

        // ── 2. PROVIDER PROFİLİ ───────────────────────────────────────────────
        // Emre hem berber hem fitness koçu - 2 ayrı işletmesi var, tek provider
        var provider = new Provider
        {
            Id = 1,
            UserId = 2,
            Title = "Berber & Fitness Koçu",
            Bio =
                "10 yıllık berberlik ve 5 yıllık kişisel antrenörlük deneyimi. Her iki işletmemi de kendim yönetiyorum.",
            AverageRating = 4.9,
            TotalReviews = 3,
            AcceptsOnlineBooking = true,
            IsActive = true,
            CreatedAt = Utc(2024, 1, 5),
        };
        await db.Providers.AddAsync(provider);
        await db.SaveChangesAsync();

        // ── 3. BUSINESSES ─────────────────────────────────────────────────────
        // Aynı provider'ın 2 farklı işletmesi
        var businesses = new List<Business>
        {
            new()
            {
                Id = 1,
                Name = "Prestige Barber Studio",
                ProviderId = 1,
                Description =
                    "İstanbul'un kalbinde premium erkek kuaförü. Modern teknikler, klasik dokunuş.",
                Address = "Nişantaşı Mah. Teşvikiye Cad. No:42",
                City = "İstanbul",
                Phone = "02122345001",
                Email = "info@prestigebarber.com",
                Website = "https://prestigebarber.com",
                IsVerified = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 2,
                Name = "Form Fitness & Wellness",
                ProviderId = 1,
                Description = "Kişiselleştirilmiş antrenman programları ve wellness hizmetleri.",
                Address = "Bağcılar Cad. No:88 Levent",
                City = "İstanbul",
                Phone = "02122345003",
                Email = "info@formfitness.com",
                IsVerified = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
        };
        await db.Businesses.AddRangeAsync(businesses);
        await db.SaveChangesAsync();

        // ── 4. SERVICES ──────────────────────────────────────────────────────
        var services = new List<Service>
        {
            // Berber işletmesi hizmetleri
            new()
            {
                Id = 1,
                BusinessId = 1,
                CategoryId = 20,
                Name = "Klasik Saç Kesimi",
                Description = "Yıkama + kesim + şekillendirme.",
                Price = 250,
                DurationMinutes = 30,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 2,
                BusinessId = 1,
                CategoryId = 20,
                Name = "Fade Kesim",
                Description = "Modern fade tekniği ile kesim.",
                Price = 300,
                DurationMinutes = 45,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 3,
                BusinessId = 1,
                CategoryId = 20,
                Name = "Saç + Sakal Paketi",
                Description = "Saç kesimi ve sakal şekillendirme.",
                Price = 400,
                DurationMinutes = 60,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 4,
                BusinessId = 1,
                CategoryId = 20,
                Name = "Sakal Tıraşı",
                Description = "Geleneksel jilet ile sakal tıraşı.",
                Price = 150,
                DurationMinutes = 20,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            // Fitness işletmesi hizmetleri
            new()
            {
                Id = 5,
                BusinessId = 2,
                CategoryId = 30,
                Name = "PT Seansı (1 Saat)",
                Description = "Birebir kişisel antrenör eşliğinde antrenman.",
                Price = 500,
                DurationMinutes = 60,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
            new()
            {
                Id = 6,
                BusinessId = 2,
                CategoryId = 30,
                Name = "Vücut Analizi",
                Description = "İnbody + program danışmanlığı.",
                Price = 200,
                DurationMinutes = 30,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
            new()
            {
                Id = 7,
                BusinessId = 2,
                CategoryId = 31,
                Name = "Yoga Dersi",
                Description = "Hatha yoga, 60 dakika.",
                Price = 250,
                DurationMinutes = 60,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
        };
        await db.Services.AddRangeAsync(services);
        await db.SaveChangesAsync();

        // ── 5. TIME SLOTS ─────────────────────────────────────────────────────
        var today = DateTime.UtcNow.Date;
        var slots = new List<TimeSlot>();
        int slotId = 1;

        // Gelecek 7 gün için slotlar (09:00 - 17:00, saatlik)
        for (int day = 0; day < 7; day++)
        {
            var date = today.AddDays(day);
            if (date.DayOfWeek == DayOfWeek.Sunday)
                continue;

            for (int hour = 9; hour < 17; hour++)
            {
                slots.Add(
                    new TimeSlot
                    {
                        Id = slotId++,
                        ProviderId = 1,
                        StartTime = date.AddHours(hour),
                        EndTime = date.AddHours(hour + 1),
                        Status = SlotStatus.Available,
                        CreatedAt = Utc(2024, 1, 1),
                    }
                );
            }
        }

        // Geçmiş slotlar (tamamlanan randevular için)
        int ps = slotId;
        var pastSlots = new[]
        {
            new TimeSlot
            {
                Id = ps,
                ProviderId = 1,
                StartTime = today.AddDays(-10).AddHours(10),
                EndTime = today.AddDays(-10).AddHours(11),
                Status = SlotStatus.Booked,
                CreatedAt = Utc(2024, 1, 1),
            },
            new TimeSlot
            {
                Id = ps + 1,
                ProviderId = 1,
                StartTime = today.AddDays(-7).AddHours(14),
                EndTime = today.AddDays(-7).AddHours(15),
                Status = SlotStatus.Booked,
                CreatedAt = Utc(2024, 1, 1),
            },
            new TimeSlot
            {
                Id = ps + 2,
                ProviderId = 1,
                StartTime = today.AddDays(-5).AddHours(11),
                EndTime = today.AddDays(-5).AddHours(12),
                Status = SlotStatus.Booked,
                CreatedAt = Utc(2024, 1, 1),
            },
        };
        slots.AddRange(pastSlots);
        await db.TimeSlots.AddRangeAsync(slots);
        await db.SaveChangesAsync();

        // ── 6. APPOINTMENTS ───────────────────────────────────────────────────
        var appointments = new List<Appointment>
        {
            // Tamamlanan randevular
            new()
            {
                Id = 1,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 1, // Klasik Saç Kesimi
                TimeSlotId = ps,
                PricePaid = 250,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = "Lütfen kısa bırakın.",
                CreatedAt = today.AddDays(-10),
                StartTime = today.AddDays(-10).AddHours(10),
                EndTime = today.AddDays(-10).AddHours(10).AddMinutes(30),
                CompletedAt = today.AddDays(-10).AddHours(10).AddMinutes(30),
            },
            new()
            {
                Id = 2,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 5, // PT Seansı
                TimeSlotId = ps + 1,
                PricePaid = 500,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = null,
                CreatedAt = today.AddDays(-7),
                StartTime = today.AddDays(-7).AddHours(14),
                EndTime = today.AddDays(-7).AddHours(15),
                CompletedAt = today.AddDays(-7).AddHours(15),
            },
            new()
            {
                Id = 3,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 3, // Saç + Sakal Paketi
                TimeSlotId = ps + 2,
                PricePaid = 400,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = "Sakalı düzgün şekillendir.",
                CreatedAt = today.AddDays(-5),
                StartTime = today.AddDays(-5).AddHours(11),
                EndTime = today.AddDays(-5).AddHours(12),
                CompletedAt = today.AddDays(-5).AddHours(12),
            },
            // Yaklaşan randevu (slot 1)
            new()
            {
                Id = 4,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 2, // Fade Kesim
                TimeSlotId = 1,
                PricePaid = 300,
                Status = AppointmentStatus.Confirmed,
                ReceiverNotes = null,
                CreatedAt = today.AddDays(-1),
                ConfirmedAt = today.AddDays(-1).AddHours(12),
                StartTime = today.AddDays(1).AddHours(9),
                EndTime = today.AddDays(1).AddHours(9).AddMinutes(45),
            },
            // Bekleyen randevu (slot 2)
            new()
            {
                Id = 5,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 7, // Yoga Dersi
                TimeSlotId = 2,
                PricePaid = 250,
                Status = AppointmentStatus.Pending,
                ReceiverNotes = "İlk dersim olacak.",
                CreatedAt = today,
                StartTime = today.AddDays(2).AddHours(9),
                EndTime = today.AddDays(2).AddHours(10),
            },
        };
        await db.Appointments.AddRangeAsync(appointments);
        await db.SaveChangesAsync();

        // Kullanılan slotları Booked yap
        var usedSlotIds = new[] { 1, 2 };
        var usedSlots = await db.TimeSlots.Where(ts => usedSlotIds.Contains(ts.Id)).ToListAsync();
        usedSlots.ForEach(ts => ts.Status = SlotStatus.Booked);
        await db.SaveChangesAsync();

        // ── 7. REVIEWS ────────────────────────────────────────────────────────
        var reviews = new List<Review>
        {
            new()
            {
                Id = 1,
                AppointmentId = 1,
                AuthorId = 1,
                ProviderId = 1,
                Rating = 5,
                Comment = "Emre bey gerçekten çok iyi! Kesim mükemmel oldu, tekrar geleceğim.",
                CreatedAt = today.AddDays(-9),
                ProviderReply = "Teşekkürler! Sizi tekrar bekliyoruz.",
                IsVisible = true,
            },
            new()
            {
                Id = 2,
                AppointmentId = 2,
                AuthorId = 1,
                ProviderId = 1,
                Rating = 5,
                Comment = "PT seansı harikaydı, çok profesyonel yaklaşım.",
                CreatedAt = today.AddDays(-6),
                IsVisible = true,
            },
            new()
            {
                Id = 3,
                AppointmentId = 3,
                AuthorId = 1,
                ProviderId = 1,
                Rating = 5,
                Comment = "Saç ve sakal paketi çok iyi, kesinlikle tavsiye ederim.",
                CreatedAt = today.AddDays(-4),
                IsVisible = true,
            },
        };
        await db.Reviews.AddRangeAsync(reviews);
        await db.SaveChangesAsync();

        // Provider puanını güncelle
        provider.TotalReviews = reviews.Count;
        provider.AverageRating = reviews.Average(r => r.Rating);
        db.Providers.Update(provider);

        // ── 8. NOTIFICATIONS ─────────────────────────────────────────────────
        var notifications = new List<Notification>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                Title = "Randevunuz Onaylandı",
                Message = "Prestige Barber'daki Fade Kesim randevunuz onaylandı.",
                Type = "Success",
                IsRead = false,
                CreatedAt = today.AddDays(-1),
            },
            new()
            {
                Id = 2,
                UserId = 1,
                Title = "Randevu Hatırlatması",
                Message = "Yarın saat 09:00'da Emre Şahin ile randevunuz var.",
                Type = "Info",
                IsRead = false,
                CreatedAt = today,
            },
            new()
            {
                Id = 3,
                UserId = 1,
                Title = "Randevu Talebiniz Alındı",
                Message = "Yoga Dersi randevunuz onay bekliyor.",
                Type = "Info",
                IsRead = true,
                CreatedAt = today,
            },
            new()
            {
                Id = 4,
                UserId = 2,
                Title = "Yeni Randevu Talebi",
                Message = "Ahmet Yılmaz Yoga Dersi için randevu talep etti.",
                Type = "Info",
                IsRead = false,
                CreatedAt = today,
            },
            new()
            {
                Id = 5,
                UserId = 2,
                Title = "Yeni Yorum",
                Message = "Ahmet Yılmaz 5 yıldız bıraktı: 'PT seansı harikaydı'",
                Type = "Success",
                IsRead = false,
                CreatedAt = today.AddDays(-6),
            },
        };
        await db.Notifications.AddRangeAsync(notifications);
        await db.SaveChangesAsync();

        // ── 9. SEQUENCE RESET ─────────────────────────────────────────────────
        if (db.Database.IsRelational())
        {
#pragma warning disable EF1002
            foreach (
                var table in new[]
                {
                    "Users",
                    "Providers",
                    "Businesses",
                    "Services",
                    "TimeSlots",
                    "Appointments",
                    "Reviews",
                    "Notifications",
                }
            )
            {
                await db.Database.ExecuteSqlRawAsync(
                    $"""
                    SELECT setval(
                        pg_get_serial_sequence('"{table}"', 'Id'),
                        (SELECT MAX("Id") FROM "{table}"));
                    """
                );
            }
#pragma warning restore EF1002
        }
    }

    private static DateTime Utc(int y, int m, int d) => new(y, m, d, 0, 0, 0, DateTimeKind.Utc);
}
