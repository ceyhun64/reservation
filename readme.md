# Universal Appointment System — Backend API

A scalable, multi-tenant appointment management system designed for any
industry—healthcare, beauty, education, fitness, legal services, and more.
Built with clean architecture, JWT authentication, and PostgreSQL for data
persistence.

---

## 🚀 Project Overview

The backend is an ASP.NET Core Web API that exposes endpoints for
registering users, managing providers and businesses, booking and
tracking appointments, and handling notifications and reviews. The API is
fully documented using Swagger and supports role-based access control.

**Technologies & Tools**

- .NET 8 (ASP.NET Core Web API)
- Entity Framework Core with Npgsql (PostgreSQL)
- JWT Authentication
- Redis (StackExchange.Redis)
- Swagger / OpenAPI
- FluentValidation
- Serilog
- xUnit & Moq for unit and integration tests
- Docker / Docker Compose
- Twilio (SMS notifications)
- SendGrid (Email notifications)
- SignalR (Real-time notifications)

---

## 🏗 Architecture Diagram

```mermaid
flowchart TB
    subgraph Client
      Web[Next.js Frontend]
    end

    subgraph API["ASP.NET Core API"]
      Controllers --> Validators
      Controllers --> Repositories
      Repositories --> UnitOfWork
      UnitOfWork --> DbContext
      Controllers --> CacheService
      Controllers --> NotificationService
      Controllers --> EmailService
      Controllers --> SmsService
    end

    subgraph Infrastructure
      DbContext --> PostgreSQL
      CacheService --> Redis
      NotificationService --> SignalR
      EmailService --> SendGrid
      SmsService --> Twilio
    end

    Web -->|JWT| Controllers
    Web <-->|WebSocket| SignalR
```

---

## 🐳 Docker ile Hızlı Başlangıç

En kolay kurulum yolu Docker Compose ile:

```bash
# 1. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını açıp DB_PASSWORD ve JWT_SECRET değerlerini doldur

# 2. Tüm servisleri ayağa kaldır (PostgreSQL + Redis + API)
docker compose up --build
```

API `http://localhost:5000/swagger` adresinde çalışır.

---

## 🛠 Manuel Kurulum

1. Repoyu klonla:
   ```bash
   git clone <repo-url>
   cd api
   ```
2. Paketleri yükle ve migration'ları uygula:
   ```bash
   dotnet restore
   dotnet ef database update
   ```
3. **Konfigürasyon**
   - `appsettings.Development.json` dosyasını oluştur ve bağlantı bilgilerini gir:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=reservation;Username=postgres;Password=YOUR_PASSWORD"
     },
     "Jwt": {
       "Secret": "YOUR_JWT_SECRET"
     },
     "Redis": {
       "ConnectionString": "localhost:6379"
     },
     "Twilio": {
       "AccountSid": "YOUR_TWILIO_ACCOUNT_SID",
       "AuthToken": "YOUR_TWILIO_AUTH_TOKEN",
       "FromNumber": "+1XXXXXXXXXX"
     },
     "SendGrid": {
       "ApiKey": "YOUR_SENDGRID_API_KEY",
       "FromEmail": "noreply@yourdomain.com",
       "FromName": "Reservation"
     }
   }
   ```
4. Uygulamayı başlat:
   ```bash
   dotnet run
   ```
5. Swagger UI: `http://localhost:5000/swagger`

---

## 🔐 Roles & Permissions

| Role     | Description                                              |
| -------- | -------------------------------------------------------- |
| Receiver | Book appointments, cancel, leave reviews                 |
| Provider | Create time slots, manage appointments, reply to reviews |
| Business | Manage business profile and services                     |
| Admin    | Full access including moderation and database seeding    |

---

## 📚 API Endpoints (Selected)

Below is a high-level summary; use Swagger for full details.

### Authentication

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/auth/register` | Register new user          |
| POST   | `/api/auth/login`    | Authenticate and issue JWT |

### Categories

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| GET    | `/api/categories`      | Get full category tree  |
| GET    | `/api/categories/{id}` | Get category by id      |
| POST   | `/api/categories`      | Create category (Admin) |

### Businesses

| Method | Endpoint               | Description                |
| ------ | ---------------------- | -------------------------- |
| GET    | `/api/businesses`      | Search & filter            |
| GET    | `/api/businesses/{id}` | Get details                |
| POST   | `/api/businesses`      | Create business (Provider) |
| PUT    | `/api/businesses/{id}` | Update business            |
| DELETE | `/api/businesses/{id}` | Soft delete                |

_(Full endpoint list available in Swagger UI.)_

---

## ⚙️ Core Infrastructure

- **Repository & Unit‑of‑Work Pattern**: `IRepository`, `UnitOfWork` ve concrete implementasyonlar database erişimini soyutlar, test edilebilirliği artırır.
- **Global Exception Middleware**: `GlobalExceptionMiddleware.cs` tüm unhandled exception'ları yakalar ve tutarlı `ApiResponse` nesneleri döner.
- **FluentValidation**: `Validators/` klasöründeki validator'lar (ör. `AuthValidator`, `ServiceValidator`) ile DTO'lar validate edilir.
- **Redis Cache**: `ICacheService` / `RedisCacheService` ile önbellekleme; `CacheKeys` helper'ı ile merkezi key yönetimi.
- **Serilog**: Console ve dosya bazlı yapılandırılmış loglama, günlük rotasyon desteğiyle.
- **Data Seeding**: `DataSeeder.cs` uygulama başlarken örnek kullanıcı, provider, business, servis ve kategori verilerini yükler.

---

## 📡 Real-Time Notifications — SignalR

Kullanıcılara anlık bildirim göndermek için ASP.NET Core SignalR kullanılmaktadır.

### Nasıl Çalışır?

Kullanıcı giriş yaptıktan sonra frontend, JWT token ile SignalR hub'a WebSocket bağlantısı açar. Sunucu tarafında bir işlem gerçekleştiğinde (randevu oluşturma, onaylama, iptal vb.) `INotificationService` üzerinden ilgili kullanıcıya anlık bildirim iletilir.

```
Frontend  ──WebSocket──►  /hubs/notification  ──►  NotificationService  ──►  Kullanıcı
```

### Hub Endpoint

```
ws://localhost:5000/hubs/notification
```

Bağlantı kurarken JWT token query string veya header ile iletilmelidir:

```javascript
const connection = new HubConnectionBuilder()
  .withUrl("http://localhost:5000/hubs/notification", {
    accessTokenFactory: () => session.accessToken,
  })
  .withAutomaticReconnect()
  .build();

connection.on("ReceiveNotification", (notification) => {
  console.log(notification);
});

await connection.start();
```

### Tetiklenen Olaylar

| Olay                        | Alıcı            | Açıklama                                 |
| --------------------------- | ---------------- | ---------------------------------------- |
| Randevu oluşturuldu         | Receiver + Provider | Her iki tarafa ayrı bildirim gönderilir |
| Durum değişti (onay/red)    | Receiver         | Provider aksiyonu sonrası tetiklenir     |
| Müşteri iptal etti          | Provider         | Receiver iptal ettiğinde provider bildirilir |
| Randevu tamamlandı          | Receiver         | Değerlendirme yapması için yönlendirilir |

### Konfigürasyon (`Program.cs`)

```csharp
builder.Services.AddSignalR();
app.MapHub<NotificationHub>("/hubs/notification");
```

> **Not:** Birden fazla sunucu örneği (horizontal scaling) çalıştırılıyorsa SignalR backplane olarak Redis kullanılmalıdır:
> ```csharp
> builder.Services.AddSignalR().AddStackExchangeRedis("localhost:6379");
> ```

---

## 📧 Email Notifications — SendGrid

Randevu işlemlerinde kullanıcılara otomatik e-posta gönderimi için **SendGrid** entegrasyonu kullanılmaktadır.

### Kurulum

```bash
dotnet add package SendGrid
```

### Konfigürasyon (`appsettings.json`)

```json
"SendGrid": {
  "ApiKey": "YOUR_SENDGRID_API_KEY",
  "FromEmail": "noreply@yourdomain.com",
  "FromName": "Reservation"
}
```

### Gönderilen E-postalar

| Durum                   | Alıcı              | İçerik                                        |
| ----------------------- | ------------------ | --------------------------------------------- |
| Randevu oluşturuldu     | Receiver + Provider | Randevu detayları ve bekleme durumu           |
| Durum değişti           | Receiver           | Onay / red / tamamlandı bilgisi               |
| Müşteri iptal etti      | Provider           | Müşteri adı ve iptal nedeni                   |

### Servis Arayüzü

```csharp
public interface IEmailService
{
    Task SendAppointmentCreatedAsync(AppointmentEmailDto dto);
    Task SendAppointmentStatusChangedAsync(AppointmentEmailDto dto, string status, string? reason);
}
```

### SendGrid Dashboard

1. [sendgrid.com](https://sendgrid.com) → **Settings → API Keys → Create API Key**
2. İzin: **Mail Send (Full Access)**
3. **Sender Authentication**: Gönderici domain veya tek adres doğrulaması yapılmalıdır, aksi halde e-postalar spam klasörüne düşer.

> **Not:** SendGrid'in ücretsiz planı günlük **100 e-posta** limitine sahiptir. Production ortamı için ücretli plana geçilmesi önerilir.

---

## 📱 SMS Notifications — Twilio

Randevu işlemlerinde kullanıcılara SMS gönderimi için **Twilio** entegrasyonu kullanılmaktadır.

### Kurulum

```bash
dotnet add package Twilio
```

### Konfigürasyon (`appsettings.json`)

```json
"Twilio": {
  "AccountSid": "YOUR_TWILIO_ACCOUNT_SID",
  "AuthToken":  "YOUR_TWILIO_AUTH_TOKEN",
  "FromNumber": "+1XXXXXXXXXX"
}
```

### Gönderilen SMS'ler

| Durum                   | Alıcı    | Örnek İçerik                                                     |
| ----------------------- | -------- | ---------------------------------------------------------------- |
| Randevu oluşturuldu     | Receiver | `Merhaba Ali, Prestige Barber Studio icin 07.03.2026 12:00 tarihli randevunuz olusturuldu.` |
| Durum değişti           | Receiver | `...randevunuz onaylandi / reddedildi / tamamlandi.`             |
| İptal edildi            | Receiver | `...randevunuz iptal edildi.`                                    |
| Hatırlatma              | Receiver | `Hatirlatma: 07.03.2026 12:00 tarihinde ... randevunuz var.`     |

### Türkçe Karakter Uyumluluğu

GSM 7-bit SMS standardı Türkçe karakterleri (ş, ğ, ü, ö, ç, ı, İ…) desteklemez. Bu karakterler gönderimde bozulur (örn. `Ü` → `^`). `SmsService` içindeki `N()` yardımcı metodu tüm metni otomatik olarak ASCII'ye normalize eder:

```csharp
private static string N(string text) =>
    text
        .Replace('ç', 'c').Replace('Ç', 'C')
        .Replace('ğ', 'g').Replace('Ğ', 'G')
        .Replace('ı', 'i').Replace('İ', 'I')
        .Replace('ö', 'o').Replace('Ö', 'O')
        .Replace('ş', 's').Replace('Ş', 'S')
        .Replace('ü', 'u').Replace('Ü', 'U');
```

### Servis Arayüzü

```csharp
public interface ISmsService
{
    Task SendAppointmentCreatedAsync(string toPhone, string customerName, string businessName, DateTime appointmentTime);
    Task SendAppointmentStatusChangedAsync(string toPhone, string customerName, string businessName, DateTime appointmentTime, string status);
    Task SendAppointmentCancelledAsync(string toPhone, string customerName, string businessName, DateTime appointmentTime);
    Task SendAppointmentReminderAsync(string toPhone, string customerName, string businessName, DateTime appointmentTime);
}
```

### Twilio Hesap Notları

| Özellik                  | Trial Hesap          | Ücretli Hesap         |
| ------------------------ | -------------------- | --------------------- |
| Mesaj öneki              | `Sent from your Twilio trial account -` | Yok |
| Alphanumeric Sender ID   | ❌ Desteklenmiyor    | ✅ Ülkeye göre kayıt gerekir |
| Gönderim kısıtlaması     | Yalnızca doğrulanmış numaralar | Tüm numaralar |
| Türkiye SMS fiyatı       | —                    | ~$0.05 / SMS          |

> **Not:** SMS hatası uygulamayı durdurmaz; hatalar yalnızca loglanır. Telefon numarası olmayan kullanıcılara SMS gönderimi otomatik olarak atlanır.

---

## 🔄 Example API Workflow

1. Provider registers → `POST /api/auth/register` (role=Provider)
2. Provider creates a business → `POST /api/businesses`
3. Provider adds a service → `POST /api/services`
4. Provider sets availability → `POST /api/timeslots/provider/{id}/bulk`
5. Receiver registers → `POST /api/auth/register` (role=Receiver)
6. Receiver books appointment → `POST /api/appointments`
   - ✉️ E-posta gönderilir (Receiver + Provider)
   - 📱 SMS gönderilir (Receiver)
   - 📡 SignalR bildirimi iletilir (Receiver + Provider)
7. Provider confirms → `PATCH /api/appointments/{id}/status`
   - ✉️ Durum e-postası gönderilir
   - 📱 Durum SMS'i gönderilir
   - 📡 Anlık bildirim iletilir
8. After completion, receiver reviews provider

---

## 🌐 Web Frontend

A companion Next.js application lives in the `web` directory.

**Features:**

- User registration & login (JWT stored in HttpOnly cookies)
- Role-based dashboards (receiver, provider, admin)
- Business/service discovery and search
- Calendar view for time slot selection
- Appointment booking and management
- Provider profile editing, service & slot management
- Review writing and moderation
- Real-time notifications via SignalR (`use-signalr.ts`)

**Frontend Tech Stack:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query / SWR
- `@microsoft/signalr`

```bash
cd web
npm install
npm run dev
# http://localhost:3000
```

Backend URL `.env.local` ile yapılandırılır (varsayılan: `http://localhost:5000`).

---

## 🎯 Seed Data

Uygulama başlarken aşağıdaki kategoriler otomatik yüklenir:

- **Health** (Clinic, Dental, Psychology, Physiotherapy)
- **Beauty** (Hairdresser, Makeup, Nail Art)
- **Fitness** (Personal Trainer, Yoga)
- **Entertainment** (Escape Room, Bowling)
- **Education**
- **Legal & Consulting**

---

## 🧩 Testing

```bash
cd api.Tests
dotnet test
```

- **Unit testler**: Controller ve servis katmanları Moq ile izole test edilir.
- **Integration testler**: `TestFactory` ile gerçek HTTP istekleri test edilir.
- Coverage raporu için `coverlet` kullanılabilir.

### CI Integration

`.github/workflows/ci.yml` ile her push'ta build, test ve kısa ömürlü Redis container ile integration testler otomatik çalışır.

---

## 🚀 Deployment

Docker Compose ile tüm servisler (PostgreSQL + Redis + API) tek komutla ayağa kalkar. Alternatif olarak Azure App Service, AWS Elastic Beanstalk gibi cloud platformlarına doğrudan deploy edilebilir.

---

## 📄 License

MIT License.
