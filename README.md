# Seminar Hall Booking System

IGNOU BCA 6th Semester Project (BCSP-064) - Topic 53: Seminar Hall Booking

## Project Overview

A full-stack web application for managing seminar hall bookings with a two-level approval workflow (Department Coordinator → Admin). Built for IGNOU BCA final year project submission.

## Tech Stack

### Frontend
- **Next.js 14+** (App Router, Server Components)
- **TypeScript**
- **Tailwind CSS**
- **React Big Calendar** (for calendar views)
- **Zod + React Hook Form** (form validation)
- **Sonner** (toast notifications)
- **Axios** (API client)

### Backend
- **Go 1.23+** (Golang)
- **Gin Web Framework** (HTTP router)
- **PostgreSQL 15+** (database)
- **pgx** (PostgreSQL driver)
- **JWT** (authentication)
- **bcrypt** (password hashing)

### Database
- **PostgreSQL 15+**
- Schema with triggers for overlap prevention
- Full audit trail support

## Project Structure

```
.
├── frontend/          # Next.js frontend application
├── backend/           # Go backend API
├── DB/               # Database schema and migrations
│   └── Tables.sql    # Complete PostgreSQL schema
└── CONTEXT.md        # Project requirements and specifications
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Go 1.23+
- PostgreSQL 15+

### Database Setup

1. Create PostgreSQL database:
```bash
createdb seminar_hall_db
```

2. Run the schema:
```bash
psql -d seminar_hall_db -f DB/Tables.sql
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/seminar_hall_db?sslmode=disable
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:3000
```

4. Install dependencies:
```bash
go mod download
```

5. Run the server:
```bash
go run main.go
```

Backend runs on `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Copy environment file:
```bash
cp .env.example .env.local
```

3. Update `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Install dependencies:
```bash
npm install
```

5. Run development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Features

### Public Features
- ✅ View all seminar halls
- ✅ Check real-time availability (date-wise + hourly slots)
- ✅ View hall calendar without login

### User Roles

#### Requester (Class/Club Representative)
- Create booking requests
- View request status
- Track approval workflow

#### Department Coordinator
- Review requests from department classes/clubs
- Forward or reject requests
- Add remarks

#### Admin
- Final approval/rejection/amendment
- View all bookings
- Generate reports (hall usage, department-wise)
- Manage system

### Key Features
- ✅ Two-level approval workflow
- ✅ Hourly booking support (not just full-day)
- ✅ Zero overlapping bookings (enforced by database trigger)
- ✅ Full audit trail
- ✅ Session management
- ✅ Notifications system
- ✅ Role-based access control

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

## Development Status

### ✅ Completed
- Project initialization
- Database schema (PostgreSQL)
- Backend structure (Go + Gin)
- Frontend structure (Next.js 14+)
- Basic authentication middleware
- Basic pages (home, login, dashboard, halls)

### 🚧 In Progress
- API handlers implementation
- Service layer implementation
- Repository layer implementation
- Remaining frontend pages
- Calendar integration
- Form validation

### 📋 TODO
- Complete all API endpoints
- Implement all frontend pages
- Add calendar views
- Add report generation
- Add notifications
- Testing
- Deployment configuration

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Backend (Render/Fly.io)
1. Set environment variables
2. Configure database connection
3. Deploy

### Database (Supabase/Neon)
1. Create PostgreSQL instance
2. Run schema migration
3. Update connection strings

## Project Deliverables

- [x] Synopsis (submitted)
- [ ] Full project report
  - [ ] ER Diagram
  - [ ] DFD Level-0 & Level-1
  - [ ] Table design
  - [ ] Screenshots
  - [ ] Source code (GitHub link)
- [ ] Working live URL

## License

This project is created for IGNOU BCA BCSP-064 academic purposes.

## Author

IGNOU BCA 6th Semester Student

---

**Project Deadline:** December 15, 2025

