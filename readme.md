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
    end

    subgraph Infrastructure
      DbContext --> PostgreSQL
      CacheService --> Redis
    end

    Web -->|JWT| Controllers
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

## 🔄 Example API Workflow

1. Provider registers → `POST /api/auth/register` (role=Provider)
2. Provider creates a business → `POST /api/businesses`
3. Provider adds a service → `POST /api/services`
4. Provider sets availability → `POST /api/timeslots/provider/{id}/bulk`
5. Receiver registers → `POST /api/auth/register` (role=Receiver)
6. Receiver books appointment → `POST /api/appointments`
7. Provider confirms → `PATCH /api/appointments/{id}/status`
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

**Frontend Tech Stack:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query / SWR

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
