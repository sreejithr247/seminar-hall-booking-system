You are helping me build my final-year IGNOU BCA 6th Semester project (BCSP-064)  
Project Topic (from official list): 53. Seminar Hall Booking  
Approved Title: Seminar Hall Booking System

### Tech Stack (final decision)
- Frontend: Next.js 14+ (App Router, Server Components, Tailwind CSS)
- Backend: Go (Golang) 1.23+ with clean architecture (Gin or Chi router)
- Database: PostgreSQL 15+ (schema already created – see below)
- Authentication: JWT + HTTP-only cookies + session table
- Deployment plan: Vercel (frontend) + Render/Fly.io (Go backend) + Supabase/Neon (Postgres)

### Complete Functional Requirements (must implement 100%)
1. Public home page – anyone can view real-time seminar hall availability (date-wise + hourly slots) without login
2. Registered users = representatives of either:
   - a Class/Batch under a department OR
   - a Student Club (college-level or department-level)
   → One user can represent only ONE entity (class or club)
3. Two-level approval workflow:
   Department Coordinator → Admin
   → Request → Dept review (Forward/Reject) → Admin (Approve/Reject/Amend)
4. Hourly booking supported (start_time & end_time) – not just full-day
5. Zero overlapping bookings allowed on same hall & date (enforced by DB trigger)
6. After final approval → booking appears on public calendar
7. Role-based access:
   - admin
   - dept_coordinator
   - requester (class/club rep)
   - faculty (future use)
8. Full audit trail (who approved/rejected when)
9. Notifications system
10. Session management with login_sessions table
11. Report generation (hall usage, department-wise, date-wise)

### Exact PostgreSQL Schema Already Created & Tested
(You already have the final .sql file – use it exactly as-is. Trigger prevents overlaps perfectly)

Tables:
- departments
- classes
- clubs
- halls (with JSONB facilities)
- users
- requesters (polymorphic: class or club)
- requests (two-level approval fields)
- bookings
- booking_audit_log
- login_sessions
- notifications

Custom ENUMs:
USER_ROLE, APPROVAL_STATUS, BOOKING_STATUS, REQUESTER_TYPE

Critical trigger: check_booking_overlap() → prevents double booking

### API Endpoints You Must Create in Go (REST + JWT protected where needed)

Public (no auth):
GET  /api/halls                     → list all halls + facilities
GET  /api/availability?date=YYYY-MM-DD → return all bookings for a date (for calendar)

Auth required:
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

Requester only:
POST   /api/requests                → raise new request
GET    /api/requests/my             → my requests + status

Dept Coordinator only:
GET    /api/requests/dept-pending   → requests from my department classes/clubs
PATCH  /api/requests/:id/dept-review → {status: "forwarded"/"rejected", remarks}

Admin only:
GET    /api/requests/admin-pending
PATCH  /api/requests/:id/admin-review → {status: "approved"/"rejected"/"amended", remarks}
GET    /api/bookings                → all confirmed bookings
GET    /api/reports/hall-usage
GET    /api/reports/department-usage

After admin approves → create row in bookings table → appears on public calendar

### Frontend Pages (Next.js App Router)
/
/login
/dashboard                  → role-based landing
/requester/request-new
/requester/my-requests
/coordinator/pending
/admin/pending
/admin/bookings
/admin/reports
/halls/[id]/calendar        → public detailed view

### Design & UI/UX Rules
- Clean, college-style interface (blue/white theme)
- Responsive (mobile-first)
- Calendar view using react-big-calendar or FullCalendar
- Toast notifications (sonner or react-hot-toast)
- Form validation with Zod + React Hook Form
- Proper loading & error states

### Security Rules
- All passwords hashed with bcrypt/argon2
- JWT + refresh tokens optional (start with simple JWT + session table)
- Rate limiting on login
- CSRF protection not needed (same-site cookies + in Next.js 14)

### Deliverables for IGNOU
- Synopsis (already submitted)
- Full project report with:
  - ER Diagram
  - DFD Level-0 & Level-1
  - Table design (CSV already provided)
  - Screenshots
  - Source code (GitHub link)
- Working live URL (mandatory for high marks)

### Your Job
You are now the full-stack lead developer for this exact project.
- Always refer to the PostgreSQL schema above (never change table names or core fields)
- Implement clean, production-ready, well-documented code
- Follow Go best practices (handlers, services, repositories)
- Next.js with server actions where possible
- Everything must match the requirements 100% because IGNOU evaluators check functionality strictly

Start by creating the Go project structure and PostgreSQL connection using pgx.
Then build the Next.js app directory structure.
Ask me step-by-step confirmation only if unsure.

Project deadline: Must be 100% complete and deployed before viva (target: 15 Dec 2025)

Let’s build the best Seminar Hall Booking System ever submitted for BCSP-064!