<div align="center">
  <img src="docs/banner.svg" alt="Skolar" width="100%" />

  <br/>

  A full-stack Learning Management System for schools and colleges. 13 roles, dark UI, auto-graded assessments, real-time attendance tracking.

  <br/><br/>

  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Prisma-6.0-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License"/>

</div>

---

## Why I built this

College project. But I didn't want to build something throwaway. Most LMS tools out there are either too enterprise (Moodle, Canvas) or just basic CRUD apps with nothing interesting going on. I wanted something you could hand to a small school or college and they'd actually be able to use it.

The main challenge was supporting both school and college structures under one platform. Schools have grades and sections. Colleges have departments, HODs, deans. Different hierarchy, different workflows, but a lot of shared logic underneath. That's what most of the architecture is built around.

---

## Architecture

<div align="center">
  <img src="docs/architecture.svg" alt="System Architecture" width="100%" />
</div>

<br/>

The frontend is a Vite SPA with route-based code splitting. Each role gets its own page directory. Backend is standard Express with controllers, routes, and middleware.

I went with a separate Express API instead of Next.js because I already knew Express and the mental model is simpler -- just two processes, no server/client component confusion.

---

## User Onboarding Flow

<div align="center">
  <img src="docs/user-flow.svg" alt="User Onboarding Flow" width="100%" />
</div>

<br/>

Users sign in with Google, pick their institution with a code, and land in pending. An admin or principal approves and assigns the correct role. Super admins are seeded directly into the database.

---

## Role Hierarchy

<div align="center">
  <img src="docs/roles.svg" alt="Role Hierarchy" width="100%" />
</div>

<br/>

<details>
<summary>Role breakdown (click to expand)</summary>
<br/>

| Tier | Role | Scope | Can do |
|------|------|-------|--------|
| Platform | Super Admin | Everything | Manage institutions, users, analytics, settings |
| Platform | Admin | Assigned institutions | Approve users, monitor stats |
| School | Principal | Own school | Manage grades, sections, teachers, students |
| School | Vice Principal | Assigned grades | Same as principal, grade-scoped |
| College | Chairman | Own college | Full college oversight |
| College | Vice Chairman | Own college | Delegated authority |
| College | Dean | Faculty level | Manage departments under faculty |
| College | HOD | Single department | Department-level management |
| Shared | Teacher | Assigned subjects | Attendance, assessments, results |
| Shared | Student | Own data | View grades, take assessments |

</details>

---

## What it does

The core features, grouped by who uses them:

<table>
<tr>
<td width="33%" valign="top">

**Administration**
- Multi-institution management
- User approval workflow
- Role assignment and scoping
- Platform-wide analytics
- Institution-level reporting

</td>
<td width="33%" valign="top">

**Teaching**
- Mark attendance per section/subject
- Create MCQ assessments (auto-graded)
- Track student performance
- View assigned classes and students
- Track student performance

</td>
<td width="33%" valign="top">

**Learning**
- Take timed MCQ assessments
- View attendance history
- Check grades and scores
- Browse subjects and teachers
- View performance reports

</td>
</tr>
</table>

---

## Project structure

```
skolar/
├── src/                         # React frontend
│   ├── api/                     # Axios client config
│   ├── components/
│   │   ├── charts/              # Recharts wrappers (donut, bar, pie)
│   │   ├── layout/              # Sidebar, Header, DashboardLayout
│   │   └── ui/                  # Badge, DataTable, Modal, StatCard, etc.
│   ├── context/                 # AuthContext (Google OAuth state)
│   ├── hooks/                   # useAPI (stale-while-revalidate caching)
│   └── pages/
│       ├── superadmin/          # Overview, Schools, Colleges, Users, Analytics
│       ├── admin/               # Dashboard, approvals
│       ├── school/
│       │   ├── principal/       # Grades, sections, teachers, students
│       │   ├── viceprincipal/   # Grade-scoped views
│       │   ├── teacher/         # Attendance, assessments, results
│       │   └── student/         # Grades, attendance, assessments
│       └── college/
│           ├── chairman/        # College-wide oversight
│           ├── dean/            # Faculty management
│           ├── hod/             # Department management
│           ├── teacher/         # Same as school teacher
│           └── student/         # Same as school student
│
├── skolar-backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 14 data models
│   │   └── seed.js              # Sample institutions + users
│   └── src/
│       ├── config/              # Prisma singleton, Passport setup
│       ├── controllers/         # 13 controller files (one per role)
│       ├── middleware/           # JWT auth + 60s user cache
│       ├── routes/              # Express route definitions
│       └── utils/               # Helpers
│
├── index.html
├── vite.config.js
└── package.json
```

---

## Running locally

Prerequisites: Node 18+, PostgreSQL (I used Neon's free tier, any Postgres works).

```bash
git clone https://github.com/Ragulvl/skolar.git
cd skolar
npm install

cd skolar-backend
npm install
```

<details>
<summary>Environment variables</summary>
<br/>

Create `skolar-backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/skolar
JWT_SECRET=pick-something-random
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=another-random-string
FRONTEND_URL=http://localhost:5173
```

Create `.env` in root:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

</details>

Set up the database and run:

```bash
# database
cd skolar-backend
npx prisma generate
npx prisma db push
npm run seed

# terminal 1 — backend
npm run dev

# terminal 2 — frontend (from root)
npm run dev
```

Frontend on `localhost:5173`, backend on `localhost:5000`.

---

## Database

14 Prisma models. The schema handles both school structure (grades, sections) and college structure (departments) within the same data model.

```mermaid
erDiagram
    Institution ||--o{ User : has
    Institution ||--o{ Section : has
    Institution ||--o{ Department : has
    Institution ||--o{ Subject : has
    Grade ||--o{ Section : contains
    Grade ||--o{ Subject : covers
    Department ||--o{ Subject : offers
    User ||--o{ TeacherAssignment : teaches
    User ||--o{ Attendance : "marks/receives"
    User ||--o{ Assessment : creates
    User ||--o{ AssessmentResult : submits
    Subject ||--o{ Assessment : has
    Assessment ||--o{ AssessmentQuestion : contains
    Assessment ||--o{ AssessmentResult : produces
```

<details>
<summary>Key models</summary>
<br/>

| Model | Purpose |
|-------|---------|
| `Institution` | School or college, identified by unique code |
| `User` | Google ID, role, linked to institution/grade/section/dept |
| `Grade` | Master lookup (PreKG through 12th) |
| `Section` | A/B/C within a grade, scoped per institution |
| `Department` | College-only, has optional dean/HOD refs |
| `Subject` | Belongs to grade (school) or department (college) |
| `Attendance` | Per student, per subject, per date |
| `Assessment` | MCQ with questions and auto-grading |

</details>

---

## Tech choices and why

| Tech | Why |
|------|-----|
| **React 19** | Latest features, good ecosystem. Used with Vite for fast dev server. |
| **Express 4** | Already knew it. Simpler mental model than Next.js for this project. |
| **Prisma 6** | Schema-as-code, type safety, `db push` workflow is fast during dev. |
| **Google OAuth** | Didn't want to deal with password resets and email verification for a college project. Everyone has Google. |
| **Tailwind v4** | Fast styling, no context switching. The new v4 is noticeably faster. |
| **Recharts** | Simple charts, smaller bundle than Chart.js. Donut, bar, pie were enough. |

---

## Performance notes

Initial page loads were 3-5 seconds. That was unacceptable. What I fixed:

- Consolidated to a single PrismaClient singleton (was accidentally creating 10+ instances)
- Added in-memory user cache in auth middleware with 60s TTL
- Replaced N+1 query patterns with `include` and `groupBy`
- Parallelized independent queries with `Promise.all`
- Used `_count` instead of fetching entire arrays just to count them
- Built a custom `useAPI` hook with stale-while-revalidate -- pages render from cache instantly while background fetch updates

Most views load under a second now.

---

## Known limitations

- Assessment system only supports MCQs right now. Descriptive type exists in the schema but isn't wired up on the frontend.
- No file uploads anywhere -- no assignment submissions, no profile photos.
- No real-time features (websockets). Everything is request-response.
- No email or SMS notifications. Reminders are dashboard-only.
- Mobile responsiveness is hit or miss. Works on tablets, phones are rough in some views.
- No tests. Time constraints -- I know.

---

## License

MIT. Do what you want with it.

---

<div align="center">

Built by **Ragul VL** as a college project.

If you're working on something similar or forking this, go for it.

</div>
