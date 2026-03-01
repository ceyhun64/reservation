# Universal Appointment System — Backend API

Her sektöre uygun, çok kullanıcılı evrensel randevu yönetim sistemi.

---

## Mimari Özeti

```
User (Receiver / Provider / Provider / Admin)
  │
  ├─▶ Business (İşletme: Klinik, Kuaför, Spor Salonu...)
  │     └─▶ Service (Hizmet: Saç Kesimi, Diş Muayenesi...)
  │               └─▶ Category (Kategori ağacı: Sağlık > Klinik > Dermatoloji)
  │
  ├─▶ Provider (Randevu Veren: Doktor, Kuaför, Trainer...)
  │     ├─▶ ProviderService (Sunduğu hizmetler, özel fiyat/süre)
  │     ├─▶ TimeSlot (Müsait zaman dilimleri)
  │     └─▶ Review (Aldığı değerlendirmeler)
  │
  └─▶ Appointment (Randevu: Receiver + Provider + Service + TimeSlot)
        ├─▶ Durum: Pending → Confirmed → Completed
        │                └→ Rejected / CancelledByReceiver / NoShow
        └─▶ Review (Tamamlanan randevuya 1 yorum)
```

---

## Kurulum

```bash
# 1. Proje oluştur
dotnet new webapi -n api --no-https false
cd api

# 2. Paketler
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package Swashbuckle.AspNetCore

# 3. appsettings.json → DB bağlantısını ve JWT secret'ı güncelle

# 4. Migration
dotnet ef migrations add InitialCreate
dotnet ef database update

# 5. Çalıştır
dotnet run
# Swagger: http://localhost:5000
```

---

## Roller

| Rol        | Yetki                                      |
| ---------- | ------------------------------------------ |
| `Receiver` | Randevu al, iptal et, değerlendirme yaz    |
| `Provider` | Slot oluştur, randevuları yönet, cevap ver |
| `Provider` | İşletme + hizmet yönetimi, provider ekleme |
| `Admin`    | Her şey + moderasyon                       |

---

## API Endpointleri

### Auth

| Method | Endpoint             | Açıklama      |
| ------ | -------------------- | ------------- |
| POST   | `/api/auth/register` | Kayıt         |
| POST   | `/api/auth/login`    | Giriş, JWT al |

### Kategoriler

| Method | Endpoint               | Açıklama                  |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/categories`      | Hiyerarşik kategori ağacı |
| GET    | `/api/categories/{id}` | Kategori detayı           |
| POST   | `/api/categories`      | Yeni kategori (Admin)     |

### İşletmeler

| Method | Endpoint                               | Açıklama           |
| ------ | -------------------------------------- | ------------------ |
| GET    | `/api/businesses?city=&keyword=&page=` | Filtreli liste     |
| GET    | `/api/businesses/{id}`                 | Detay              |
| POST   | `/api/businesses`                      | Oluştur (Provider) |
| PUT    | `/api/businesses/{id}`                 | Güncelle           |
| DELETE | `/api/businesses/{id}`                 | Sil (soft delete)  |

### Provider'lar

| Method | Endpoint                                                         | Açıklama          |
| ------ | ---------------------------------------------------------------- | ----------------- |
| GET    | `/api/providers?keyword=&categoryId=&city=&maxPrice=&minRating=` | Arama             |
| GET    | `/api/providers/{id}`                                            | Detay             |
| POST   | `/api/providers`                                                 | Profil oluştur    |
| PUT    | `/api/providers/{id}`                                            | Güncelle          |
| GET    | `/api/providers/{id}/services`                                   | Sunduğu hizmetler |
| POST   | `/api/providers/{id}/services`                                   | Hizmet ekle       |

### Hizmetler

| Method | Endpoint                                         | Açıklama           |
| ------ | ------------------------------------------------ | ------------------ |
| GET    | `/api/services?categoryId=&businessId=&keyword=` | Filtreli liste     |
| GET    | `/api/services/{id}`                             | Detay              |
| POST   | `/api/services`                                  | Oluştur (Provider) |
| PUT    | `/api/services/{id}`                             | Güncelle           |
| DELETE | `/api/services/{id}`                             | Sil                |

### Zaman Slotları

| Method | Endpoint                             | Açıklama           |
| ------ | ------------------------------------ | ------------------ |
| GET    | `/api/timeslots/provider/{id}?date=` | Müsait slotlar     |
| POST   | `/api/timeslots/provider/{id}`       | Tekli slot ekle    |
| POST   | `/api/timeslots/provider/{id}/bulk`  | Toplu slot oluştur |
| PATCH  | `/api/timeslots/{slotId}/block`      | Slotu bloke et     |
| DELETE | `/api/timeslots/{slotId}`            | Slot sil           |

### Randevular

| Method | Endpoint                          | Açıklama                                        |
| ------ | --------------------------------- | ----------------------------------------------- |
| GET    | `/api/appointments/my`            | Kendi randevularım                              |
| GET    | `/api/appointments/provider`      | Provider olarak gelenler                        |
| GET    | `/api/appointments/business/{id}` | İşletme randevuları                             |
| POST   | `/api/appointments`               | Randevu al                                      |
| PATCH  | `/api/appointments/{id}/status`   | Durum güncelle (confirm/reject/complete/noshow) |
| PATCH  | `/api/appointments/{id}/cancel`   | İptal et (müşteri)                              |

### Değerlendirmeler

| Method | Endpoint                     | Açıklama             |
| ------ | ---------------------------- | -------------------- |
| GET    | `/api/reviews/provider/{id}` | Provider yorumları   |
| POST   | `/api/reviews`               | Yorum yaz (müşteri)  |
| PATCH  | `/api/reviews/{id}/reply`    | Cevap ver (provider) |
| PATCH  | `/api/reviews/{id}/hide`     | Gizle (Admin)        |

### Bildirimler

| Method | Endpoint                             | Açıklama        |
| ------ | ------------------------------------ | --------------- |
| GET    | `/api/notifications?unreadOnly=true` | Bildirimler     |
| PATCH  | `/api/notifications/{id}/read`       | Okundu işaretle |
| PATCH  | `/api/notifications/read-all`        | Tümünü oku      |

---

## Örnek Kullanım Akışı

```
1. Provider kayıt → POST /api/auth/register (Role: Provider)
2. İşletme oluştur    → POST /api/businesses
3. Hizmet ekle        → POST /api/services (categoryId ile kategori seç)
4. Provider kayıt     → POST /api/auth/register (Role: Provider)
5. Provider profil    → POST /api/providers (businessId opsiyonel)
6. Hizmet bağla       → POST /api/providers/{id}/services
7. Slot oluştur       → POST /api/timeslots/provider/{id}/bulk
8. Müşteri kayıt      → POST /api/auth/register (Role: Receiver)
9. Provider ara       → GET  /api/providers?categoryId=10&city=Istanbul
10. Slot bak          → GET  /api/timeslots/provider/{id}?date=2025-06-15
11. Randevu al        → POST /api/appointments
12. Provider onayla   → PATCH /api/appointments/{id}/status {"action":"confirm"}
13. Tamamla           → PATCH /api/appointments/{id}/status {"action":"complete"}
14. Müşteri yorum     → POST /api/reviews
```

---

## Seed Kategoriler

Uygulama başlatıldığında otomatik eklenir:

- **Sağlık** → Klinik, Diş Hekimi, Psikolog, Fizyoterapi
- **Güzellik** → Kuaför, Makyaj, Nail Art
- **Spor & Fitness** → Personal Trainer, Yoga
- **Eğlence** → Escape Room, Bowling, Oyun Salonu
- **Eğitim**
- **Hukuk & Danışmanlık**
