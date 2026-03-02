using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        // ── 1. USERS ──────────────────────────────────────────────────────────
        string hash = BCrypt.Net.BCrypt.HashPassword("password");
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
                FullName = "Zeynep Kaya",
                Email = "zeynep@example.com",
                PasswordHash = hash,
                Phone = "5301234002",
                Role = "Receiver",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 12),
            },
            new()
            {
                Id = 3,
                FullName = "Murat Demir",
                Email = "murat@example.com",
                PasswordHash = hash,
                Phone = "5301234003",
                Role = "Receiver",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 15),
            },
            new()
            {
                Id = 4,
                FullName = "Selin Arslan",
                Email = "selin@example.com",
                PasswordHash = hash,
                Phone = "5301234004",
                Role = "Receiver",
                IsActive = true,
                CreatedAt = Utc(2024, 2, 1),
            },
            // İşletme Sahipleri
            new()
            {
                Id = 5,
                FullName = "Emre Şahin",
                Email = "emre@barbershop.com",
                PasswordHash = hash,
                Phone = "5301235001",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 6,
                FullName = "Leyla Doğan",
                Email = "leyla@lumiere.com",
                PasswordHash = hash,
                Phone = "5301235002",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 7,
                FullName = "Can Öztürk",
                Email = "can@formfitness.com",
                PasswordHash = hash,
                Phone = "5301235003",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
            // Provider'lar (çalışanlar)
            new()
            {
                Id = 8,
                FullName = "Tarık Yıldız",
                Email = "tarik@barbershop.com",
                PasswordHash = hash,
                Phone = "5301236001",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 6),
            },
            new()
            {
                Id = 9,
                FullName = "Burak Çelik",
                Email = "burak@barbershop.com",
                PasswordHash = hash,
                Phone = "5301236002",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 6),
            },
            new()
            {
                Id = 10,
                FullName = "Nilüfer Ay",
                Email = "nilufer@lumiere.com",
                PasswordHash = hash,
                Phone = "5301236003",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 9),
            },
            new()
            {
                Id = 11,
                FullName = "Berna Koç",
                Email = "berna@lumiere.com",
                PasswordHash = hash,
                Phone = "5301236004",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 9),
            },
            new()
            {
                Id = 12,
                FullName = "Serkan Aydın",
                Email = "serkan@formfitness.com",
                PasswordHash = hash,
                Phone = "5301236005",
                Role = "Provider",
                IsActive = true,
                CreatedAt = Utc(2024, 1, 11),
            },
            // Admin
            new()
            {
                Id = 13,
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

        // ── 2. BUSINESSES ─────────────────────────────────────────────────────
        var businesses = new List<Business>
        {
            new()
            {
                Id = 1,
                Name = "Prestige Barber Studio",
                OwnerId = 5,
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
                Name = "Lumière Beauty Studio",
                OwnerId = 6,
                Description =
                    "Kadıköy'ün en prestijli güzellik salonu. Saç, cilt ve tırnak bakımında uzman ekip.",
                Address = "Moda Cad. No:15 Kadıköy",
                City = "İstanbul",
                Phone = "02162345002",
                Email = "info@lumiere.com",
                Website = "https://lumiere.com",
                IsVerified = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 3,
                Name = "Form Fitness & Wellness",
                OwnerId = 7,
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

        // ── 3. PROVIDERS ─────────────────────────────────────────────────────
        var providers = new List<Provider>
        {
            // İşletme sahiplerinin provider profilleri (yeni eklendi)
            new()
            {
                Id = 6,
                UserId = 5,
                BusinessId = 1,
                Title = "İşletme Sahibi",
                Bio = "Prestige Barber Studio sahibi.",
                AverageRating = 0,
                TotalReviews = 0,
                AcceptsOnlineBooking = false,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 5),
            },
            new()
            {
                Id = 7,
                UserId = 6,
                BusinessId = 2,
                Title = "İşletme Sahibi",
                Bio = "Lumière Beauty Studio sahibi.",
                AverageRating = 0,
                TotalReviews = 0,
                AcceptsOnlineBooking = false,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 8,
                UserId = 7,
                BusinessId = 3,
                Title = "İşletme Sahibi",
                Bio = "Form Fitness & Wellness sahibi.",
                AverageRating = 0,
                TotalReviews = 0,
                AcceptsOnlineBooking = false,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
            // Çalışan provider'lar
            new()
            {
                Id = 1,
                UserId = 8,
                BusinessId = 1,
                Title = "Baş Berber",
                Bio = "10 yıl deneyimli master berber. Fade, klasik ve modern kesim uzmanlığı.",
                AverageRating = 4.9,
                TotalReviews = 87,
                AcceptsOnlineBooking = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 6),
            },
            new()
            {
                Id = 2,
                UserId = 9,
                BusinessId = 1,
                Title = "Berber",
                Bio = "5 yıllık deneyim. Sakal şekillendirme ve bıyık bakımı konusunda uzman.",
                AverageRating = 4.7,
                TotalReviews = 52,
                AcceptsOnlineBooking = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 6),
            },
            new()
            {
                Id = 3,
                UserId = 10,
                BusinessId = 2,
                Title = "Saç Tasarımcısı",
                Bio = "Paris'te eğitim almış renk ve kesim uzmanı. 8 yıllık sektör deneyimi.",
                AverageRating = 4.8,
                TotalReviews = 134,
                AcceptsOnlineBooking = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 9),
            },
            new()
            {
                Id = 4,
                UserId = 11,
                BusinessId = 2,
                Title = "Güzellik Uzmanı",
                Bio = "Cilt bakımı, makyaj ve tırnak tasarımında sertifikalı uzman.",
                AverageRating = 4.6,
                TotalReviews = 96,
                AcceptsOnlineBooking = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 9),
            },
            new()
            {
                Id = 5,
                UserId = 12,
                BusinessId = 3,
                Title = "Kişisel Antrenör",
                Bio =
                    "Sporcu kökenli sertifikalı PT. Kilo yönetimi ve performans antrenmanı uzmanı.",
                AverageRating = 5.0,
                TotalReviews = 41,
                AcceptsOnlineBooking = true,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 11),
            },
        };
        await db.Providers.AddRangeAsync(providers);
        await db.SaveChangesAsync();

        // ── 4. SERVICES ──────────────────────────────────────────────────────
        var services = new List<Service>
        {
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
            new()
            {
                Id = 5,
                BusinessId = 2,
                CategoryId = 20,
                Name = "Saç Kesimi (Kadın)",
                Description = "Konsültasyon + kesim + fön.",
                Price = 350,
                DurationMinutes = 60,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 6,
                BusinessId = 2,
                CategoryId = 20,
                Name = "Saç Boyama",
                Description = "Tek renk boya + bakım maskesi.",
                Price = 600,
                DurationMinutes = 90,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 7,
                BusinessId = 2,
                CategoryId = 20,
                Name = "Balayage / Ombre",
                Description = "Profesyonel balayage tekniği.",
                Price = 900,
                DurationMinutes = 120,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 8,
                BusinessId = 2,
                CategoryId = 21,
                Name = "Gelin Makyajı",
                Description = "HD ve airbrush makyaj seçenekleri.",
                Price = 1500,
                DurationMinutes = 90,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 9,
                BusinessId = 2,
                CategoryId = 22,
                Name = "Manikür + Pedikür",
                Description = "Kalıcı oje dahil komple bakım.",
                Price = 400,
                DurationMinutes = 75,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 8),
            },
            new()
            {
                Id = 10,
                BusinessId = 3,
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
                Id = 11,
                BusinessId = 3,
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
                Id = 12,
                BusinessId = 3,
                CategoryId = 31,
                Name = "Yoga Dersi",
                Description = "Hatha yoga, 60 dakika grup dersi.",
                Price = 250,
                DurationMinutes = 60,
                IsActive = true,
                CreatedAt = Utc(2024, 1, 10),
            },
        };
        await db.Services.AddRangeAsync(services);

        // ── 5. PROVIDER SERVICES ─────────────────────────────────────────────
        var providerServices = new List<ProviderService>
        {
            new() { ProviderId = 1, ServiceId = 1 },
            new() { ProviderId = 1, ServiceId = 2 },
            new() { ProviderId = 1, ServiceId = 3 },
            new() { ProviderId = 1, ServiceId = 4 },
            new() { ProviderId = 2, ServiceId = 1 },
            new() { ProviderId = 2, ServiceId = 2 },
            new() { ProviderId = 2, ServiceId = 4 },
            new() { ProviderId = 3, ServiceId = 5 },
            new() { ProviderId = 3, ServiceId = 6 },
            new() { ProviderId = 3, ServiceId = 7 },
            new() { ProviderId = 4, ServiceId = 5 },
            new() { ProviderId = 4, ServiceId = 8 },
            new() { ProviderId = 4, ServiceId = 9 },
            new() { ProviderId = 5, ServiceId = 10 },
            new() { ProviderId = 5, ServiceId = 11 },
            new() { ProviderId = 5, ServiceId = 12 },
        };
        await db.ProviderServices.AddRangeAsync(providerServices);
        await db.SaveChangesAsync();

        // ── 6. TIME SLOTS ─────────────────────────────────────────────────────
        var today = DateTime.UtcNow.Date;
        var slots = new List<TimeSlot>();
        int slotId = 1;

        foreach (var providerId in new[] { 1, 2, 3, 4, 5 })
        {
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
                            ProviderId = providerId,
                            StartTime = date.AddHours(hour),
                            EndTime = date.AddHours(hour + 1),
                            Status = SlotStatus.Available,
                            CreatedAt = Utc(2024, 1, 1),
                        }
                    );
                }
            }
        }

        var pastSlots = new List<TimeSlot>();
        foreach (
            var (pid, sid, startOffset) in new[]
            {
                (1, slotId, -10),
                (1, slotId + 1, -7),
                (2, slotId + 2, -5),
                (3, slotId + 3, -14),
                (3, slotId + 4, -3),
                (5, slotId + 5, -20),
            }
        )
        {
            pastSlots.Add(
                new TimeSlot
                {
                    Id = sid,
                    ProviderId = pid,
                    StartTime = today.AddDays(startOffset).AddHours(10),
                    EndTime = today.AddDays(startOffset).AddHours(11),
                    Status = SlotStatus.Booked,
                    CreatedAt = Utc(2024, 1, 1),
                }
            );
        }
        slots.AddRange(pastSlots);
        await db.TimeSlots.AddRangeAsync(slots);
        await db.SaveChangesAsync();

        // ── 7. APPOINTMENTS ───────────────────────────────────────────────────
        int ps = slotId;
        var appointments = new List<Appointment>
        {
            new()
            {
                Id = 1,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 1,
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
                ReceiverId = 2,
                ProviderId = 1,
                ServiceId = 3,
                TimeSlotId = ps + 1,
                PricePaid = 400,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = null,
                CreatedAt = today.AddDays(-7),
                StartTime = today.AddDays(-7).AddHours(10),
                EndTime = today.AddDays(-7).AddHours(11),
                CompletedAt = today.AddDays(-7).AddHours(11),
            },
            new()
            {
                Id = 3,
                ReceiverId = 1,
                ProviderId = 2,
                ServiceId = 2,
                TimeSlotId = ps + 2,
                PricePaid = 300,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = "Fade çok kısa olmasın.",
                CreatedAt = today.AddDays(-5),
                StartTime = today.AddDays(-5).AddHours(10),
                EndTime = today.AddDays(-5).AddHours(10).AddMinutes(45),
                CompletedAt = today.AddDays(-5).AddHours(10).AddMinutes(45),
            },
            new()
            {
                Id = 4,
                ReceiverId = 3,
                ProviderId = 3,
                ServiceId = 6,
                TimeSlotId = ps + 3,
                PricePaid = 600,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = null,
                CreatedAt = today.AddDays(-14),
                StartTime = today.AddDays(-14).AddHours(10),
                EndTime = today.AddDays(-14).AddHours(11).AddMinutes(30),
                CompletedAt = today.AddDays(-14).AddHours(11).AddMinutes(30),
            },
            new()
            {
                Id = 5,
                ReceiverId = 4,
                ProviderId = 3,
                ServiceId = 5,
                TimeSlotId = ps + 4,
                PricePaid = 350,
                Status = AppointmentStatus.CancelledByReceiver,
                ReceiverNotes = null,
                CancellationReason = "Kişisel sebep",
                CreatedAt = today.AddDays(-3),
                CancelledAt = today.AddDays(-3).AddHours(15),
                StartTime = today.AddDays(-3).AddHours(10),
                EndTime = today.AddDays(-3).AddHours(11),
            },
            new()
            {
                Id = 6,
                ReceiverId = 2,
                ProviderId = 5,
                ServiceId = 10,
                TimeSlotId = ps + 5,
                PricePaid = 500,
                Status = AppointmentStatus.Completed,
                ReceiverNotes = null,
                CreatedAt = today.AddDays(-20),
                StartTime = today.AddDays(-20).AddHours(10),
                EndTime = today.AddDays(-20).AddHours(11),
                CompletedAt = today.AddDays(-20).AddHours(11),
            },
            new()
            {
                Id = 7,
                ReceiverId = 1,
                ProviderId = 1,
                ServiceId = 2,
                TimeSlotId = 1,
                PricePaid = 300,
                Status = AppointmentStatus.Confirmed,
                ReceiverNotes = null,
                CreatedAt = today.AddDays(-1),
                ConfirmedAt = today.AddDays(-1).AddHours(12),
                StartTime = today.AddDays(1).AddHours(10),
                EndTime = today.AddDays(1).AddHours(10).AddMinutes(45),
            },
            new()
            {
                Id = 8,
                ReceiverId = 2,
                ProviderId = 3,
                ServiceId = 7,
                TimeSlotId = 50,
                PricePaid = 900,
                Status = AppointmentStatus.Pending,
                ReceiverNotes = "Doğum günü hediyesi.",
                CreatedAt = today,
                StartTime = today.AddDays(2).AddHours(14),
                EndTime = today.AddDays(2).AddHours(16),
            },
            new()
            {
                Id = 9,
                ReceiverId = 3,
                ProviderId = 5,
                ServiceId = 10,
                TimeSlotId = 120,
                PricePaid = 500,
                Status = AppointmentStatus.Confirmed,
                ReceiverNotes = "2. seans.",
                CreatedAt = today.AddDays(-2),
                ConfirmedAt = today.AddDays(-1),
                StartTime = today.AddDays(3).AddHours(9),
                EndTime = today.AddDays(3).AddHours(10),
            },
            new()
            {
                Id = 10,
                ReceiverId = 4,
                ProviderId = 4,
                ServiceId = 9,
                TimeSlotId = 180,
                PricePaid = 400,
                Status = AppointmentStatus.Pending,
                ReceiverNotes = null,
                CreatedAt = today,
                StartTime = today.AddDays(4).AddHours(11),
                EndTime = today.AddDays(4).AddHours(12).AddMinutes(15),
            },
        };
        await db.Appointments.AddRangeAsync(appointments);
        await db.SaveChangesAsync();

        // ── 8. REVIEWS ────────────────────────────────────────────────────────
        var reviews = new List<Review>
        {
            new()
            {
                Id = 1,
                AppointmentId = 1,
                AuthorId = 1,
                ProviderId = 1,
                Rating = 5,
                Comment = "Tarık bey gerçekten çok iyi! Fade mükemmel oldu, tekrar geleceğim.",
                CreatedAt = today.AddDays(-9),
            },
            new()
            {
                Id = 2,
                AppointmentId = 2,
                AuthorId = 2,
                ProviderId = 1,
                Rating = 5,
                Comment = "Paket harika, saç ve sakal ikisi de çok iyi şekillendi.",
                CreatedAt = today.AddDays(-6),
                ProviderReply = "Teşekkürler! Sizi tekrar bekliyoruz.",
            },
            new()
            {
                Id = 3,
                AppointmentId = 3,
                AuthorId = 1,
                ProviderId = 2,
                Rating = 4,
                Comment = "Güzel bir fade oldu, bir dahaki sefere biraz daha kısa deneyeceğim.",
                CreatedAt = today.AddDays(-4),
            },
            new()
            {
                Id = 4,
                AppointmentId = 4,
                AuthorId = 3,
                ProviderId = 3,
                Rating = 5,
                Comment = "Nilüfer hanım renk konusunda gerçekten uzman. Çok doğal durdu.",
                CreatedAt = today.AddDays(-13),
                ProviderReply = "Güzel yorumunuz için teşekkürler 🙏",
            },
            new()
            {
                Id = 5,
                AppointmentId = 6,
                AuthorId = 2,
                ProviderId = 5,
                Rating = 5,
                Comment = "Serkan hoca müthiş! Program çok dengeli, ilk seansta sonuç gördüm.",
                CreatedAt = today.AddDays(-19),
            },
        };
        await db.Reviews.AddRangeAsync(reviews);

        foreach (var p in providers)
        {
            var pReviews = reviews.Where(r => r.ProviderId == p.Id).ToList();
            if (pReviews.Any())
            {
                p.TotalReviews = pReviews.Count;
                p.AverageRating = pReviews.Average(r => r.Rating);
            }
        }
        db.Providers.UpdateRange(providers);

        // ── 9. NOTIFICATIONS ─────────────────────────────────────────────────
        var notifications = new List<Notification>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                Title = "Randevunuz Onaylandı",
                Message = "Prestige Barber'daki Fade Kesim randevunuz (yarın 10:00) onaylandı.",
                Type = "Success",
                IsRead = false,
                CreatedAt = today.AddDays(-1),
            },
            new()
            {
                Id = 2,
                UserId = 1,
                Title = "Randevu Hatırlatması",
                Message = "Yarın saat 10:00'da Tarık Yıldız ile randevunuz var. Geç kalmayın!",
                Type = "Info",
                IsRead = false,
                CreatedAt = today,
            },
            new()
            {
                Id = 3,
                UserId = 2,
                Title = "Yeni Randevu Talebiniz",
                Message = "Balayage randevunuz Nilüfer Ay tarafından inceleniyor.",
                Type = "Info",
                IsRead = true,
                CreatedAt = today,
            },
            new()
            {
                Id = 4,
                UserId = 2,
                Title = "Randevunuz Onaylandı",
                Message = "Form Fitness'taki PT Seansı randevunuz onaylandı.",
                Type = "Success",
                IsRead = true,
                CreatedAt = today.AddDays(-2),
            },
            new()
            {
                Id = 5,
                UserId = 3,
                Title = "Randevunuz Onaylandı",
                Message = "Form Fitness'taki PT Seansı randevunuz (3 gün sonra 09:00) onaylandı.",
                Type = "Success",
                IsRead = false,
                CreatedAt = today.AddDays(-2),
            },
            new()
            {
                Id = 6,
                UserId = 4,
                Title = "Randevu Talebiniz Alındı",
                Message = "Manikür + Pedikür randevunuz onay bekliyor.",
                Type = "Info",
                IsRead = false,
                CreatedAt = today,
            },
            new()
            {
                Id = 7,
                UserId = 5,
                Title = "Yeni Randevu",
                Message = "Ahmet Yılmaz, yarın 10:00 için Fade Kesim randevusu oluşturdu.",
                Type = "Info",
                IsRead = false,
                CreatedAt = today.AddDays(-1),
            },
            new()
            {
                Id = 8,
                UserId = 5,
                Title = "Yeni Randevu",
                Message = "Zeynep Kaya, 2 gün sonra 14:00 için Saç Boyama randevusu talep etti.",
                Type = "Info",
                IsRead = true,
                CreatedAt = today,
            },
            new()
            {
                Id = 9,
                UserId = 6,
                Title = "Yeni Yorum",
                Message =
                    "Nilüfer Ay için 5 yıldızlı yeni bir değerlendirme geldi: 'Renk konusunda uzman'",
                Type = "Success",
                IsRead = false,
                CreatedAt = today.AddDays(-13),
            },
            new()
            {
                Id = 10,
                UserId = 7,
                Title = "Yeni Randevu",
                Message = "Murat Demir, 3 gün sonra 09:00 için PT Seansı randevusu oluşturdu.",
                Type = "Info",
                IsRead = false,
                CreatedAt = today.AddDays(-2),
            },
        };
        await db.Notifications.AddRangeAsync(notifications);
        await db.SaveChangesAsync();

        // ── 10. SEQUENCE RESET ────────────────────────────────────────────────
#pragma warning disable EF1002
        foreach (
            var table in new[]
            {
                "Users",
                "Businesses",
                "Providers",
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
#pragma warning restore EF1002p
    }

    private static DateTime Utc(int y, int m, int d) => new(y, m, d, 0, 0, 0, DateTimeKind.Utc);
}
