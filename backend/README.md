# Seminar Hall Booking System - Backend

Go backend API for the Seminar Hall Booking System (IGNOU BCA BCSP-064).

## Tech Stack
- Go 1.23+
- Gin Web Framework
- PostgreSQL 15+ (pgx driver)
- JWT Authentication
- Clean Architecture (Handlers → Services → Repositories)

## Project Structure
```
backend/
├── main.go                 # Application entry point
├── internal/
│   ├── config/            # Configuration management
│   ├── database/          # Database connection
│   ├── models/            # Data models
│   ├── handlers/          # HTTP handlers (to be created)
│   ├── services/          # Business logic (to be created)
│   ├── repositories/      # Data access layer (to be created)
│   ├── middleware/        # Auth, CORS, etc.
│   └── router/            # Route setup
└── .env.example           # Environment variables template
```

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL connection string:
```
DATABASE_URL=postgresql://user:password@localhost:5432/seminar_hall_db?sslmode=disable
JWT_SECRET=your-secret-key-min-32-chars
```

4. Run database migrations (execute `DB/Tables.sql` in PostgreSQL)

5. Start the server:
```bash
go run main.go
```

Server will run on `http://localhost:8080` by default.

## API Endpoints

### Public
- `GET /api/halls` - List all halls
- `GET /api/availability?date=YYYY-MM-DD` - Get availability for a date

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Requester
- `POST /api/requests` - Create new request
- `GET /api/requests/my` - Get my requests

### Dept Coordinator
- `GET /api/requests/dept-pending` - Get pending requests
- `PATCH /api/requests/:id/dept-review` - Review request

### Admin
- `GET /api/requests/admin-pending` - Get admin pending requests
- `PATCH /api/requests/:id/admin-review` - Admin review
- `GET /api/bookings` - All bookings
- `GET /api/reports/hall-usage` - Hall usage report
- `GET /api/reports/department-usage` - Department usage report

## Development

Run in development mode:
```bash
ENVIRONMENT=development go run main.go
```

