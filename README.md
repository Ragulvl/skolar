# Skolar

A full-stack Learning Management System built for managing schools and colleges under one platform. Built with React + Express + PostgreSQL.

![Dashboard](public/screenshot.png)

## What it does

Skolar lets you manage multiple educational institutions from a single admin panel. Think of it as a centralized dashboard where super admins can oversee all schools and colleges, principals can manage their own institution, teachers handle attendance and assessments, and students can track their grades.

### Roles

- **Super Admin** — Full platform control. Manages institutions, admins, users, analytics, and platform settings.
- **Admin** — Assigned to specific institutions. Reviews pending signups and monitors stats.
- **Principal / Vice Principal** — Manages grades, sections, teachers, students within their school.
- **Chairman / Vice Chairman / Dean / HOD** — Same as above but for college structure with department support.
- **Teacher** — Marks attendance, creates assessments, issues certificates.
- **Student** — Views grades, attendance history, subjects, and certificates.

## Tech Stack

**Frontend:**
- React 19, React Router v7
- Tailwind CSS v4
- Recharts for charts
- Axios for API calls
- Vite 8

**Backend:**
- Node.js + Express
- PostgreSQL with Prisma ORM
- JWT authentication
- Google OAuth (Passport.js)

## Project Structure

```
skolar/
├── src/                    # React frontend
│   ├── api/                # Axios client config
│   ├── components/         # Reusable UI components
│   │   ├── charts/         # AttendanceDonut, PieBreakdown, PerformanceBar
│   │   ├── layout/         # Sidebar, Header, DashboardLayout
│   │   └── ui/             # Badge, DataTable, Modal, StatCard, etc.
│   ├── context/            # AuthContext
│   ├── hooks/              # useAPI (client-side caching hook)
│   └── pages/
│       ├── superadmin/     # Overview, Schools, Colleges, Users, Analytics, Settings
│       ├── admin/          # Dashboard
│       ├── school/         # principal/, teacher/, student/ views
│       └── college/        # chairman/, hod/, teacher/, student/ views
│
├── skolar-backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Data model
│   │   └── seed.js         # Seed script
│   └── src/
│       ├── config/         # Prisma singleton, Passport config
│       ├── controllers/    # Route handlers
│       ├── middleware/      # Auth middleware with user caching
│       └── routes/         # Express routes
│
├── index.html
├── vite.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally or a hosted instance (I used Neon)

### Setup

1. Clone the repo

```bash
git clone https://github.com/Ragulvl/skolar.git
cd skolar
```

2. Install frontend dependencies

```bash
npm install
```

3. Install backend dependencies

```bash
cd skolar-backend
npm install
```

4. Set up environment variables

Create `skolar-backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/skolar
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=some-random-string
FRONTEND_URL=http://localhost:5173
```

Create `.env` in root:
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

5. Set up the database

```bash
cd skolar-backend
npx prisma generate
npx prisma db push
npm run seed        # seeds some sample institutions
```

6. Run both servers

```bash
# Terminal 1 — backend
cd skolar-backend
npm run dev

# Terminal 2 — frontend
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## How Auth Works

Users sign in with Google OAuth. On first login, they pick their institution using the institution code and get assigned a `pending` role. An admin or principal then approves them and assigns the correct role (teacher, student, etc). Super admins are seeded directly.

## Performance Notes

Spent a good amount of time optimizing the backend because initial load times were really slow (3-5 seconds per page). Here's what changed:

- **Single Prisma instance** — Was accidentally creating 10+ separate PrismaClient instances across controllers. Consolidated to one shared singleton which cut connection overhead massively.
- **Auth middleware caching** — Every API request was hitting the DB to look up the user. Added an in-memory cache with 60s TTL.
- **Query fixes** — Replaced N+1 patterns with `include` and `groupBy`, parallelized independent queries with `Promise.all`, used `_count` instead of loading entire arrays just to count them.
- **Frontend caching** — Built a custom `useAPI` hook that caches API responses in memory. When you navigate away and come back, data renders instantly from cache while revalidating in the background. No more loading spinner on every page visit.

## Screenshots

The UI uses a dark theme with a glassmorphism-inspired design. Sidebar navigation adapts based on user role. Charts are built with Recharts.

## License

MIT
