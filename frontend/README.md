# Seminar Hall Booking System - Frontend

Next.js 14+ frontend for the Seminar Hall Booking System (IGNOU BCA BCSP-064).

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Big Calendar
- Zod + React Hook Form
- Sonner (Toast notifications)
- Axios

## Project Structure
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── login/             # Login page
│   ├── dashboard/         # Role-based dashboard
│   ├── halls/             # Hall listing and calendar
│   ├── requester/         # Requester pages
│   ├── coordinator/       # Coordinator pages
│   └── admin/             # Admin pages
├── lib/                    # Utilities
│   ├── api.ts             # Axios client
│   └── types.ts           # TypeScript types
└── components/            # Reusable components (to be created)
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Run development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`.

## Pages

- `/` - Public home page with hall availability
- `/login` - User login
- `/dashboard` - Role-based dashboard
- `/halls` - List all halls
- `/halls/[id]/calendar` - Public calendar view for a hall
- `/requester/request-new` - Create new booking request
- `/requester/my-requests` - View my requests
- `/coordinator/pending` - Review department requests
- `/admin/pending` - Review admin pending requests
- `/admin/bookings` - View all bookings
- `/admin/reports` - Generate reports

## Development

Run in development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## Design

- Clean, college-style interface (blue/white theme)
- Responsive (mobile-first)
- Calendar view using react-big-calendar
- Toast notifications with Sonner
- Form validation with Zod + React Hook Form
