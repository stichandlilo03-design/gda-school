# GDA Schools — Global Digital Academy

> The all-in-one school operating system. Built for Africa, scaling worldwide.

**Live:** [www.gdaschools.sbs](https://www.gdaschools.sbs)

---

## What is GDA Schools?

GDA Schools replaces paper registers, WhatsApp groups, and Excel spreadsheets with a single digital platform that runs an entire school — from enrollment to graduation.

**4 portals. 14 countries. 1 platform.**

| Portal | Users | Core Function |
|--------|-------|---------------|
| **Principal** | School owners/admins | Run the school — curriculum, staff, finance, monitoring |
| **Teacher** | Instructors | Teach live classes, grade students, earn salary |
| **Student** | Learners K-12 | Attend live classes, submit work, view grades |
| **Parent** | Guardians | Track children's attendance, grades, and fees |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | NextAuth.js (credentials) |
| Styling | Tailwind CSS |
| Real-time | Database polling (3-10 sec intervals) |
| Hosting | Vercel |
| CRON | Vercel Cron Jobs (every 2 min) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│            4 ROLE-BASED PORTALS             │
│  Student │ Teacher │ Principal │ Parent      │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │   Server Actions (19) │  ← Business logic
         │   API Routes (12)     │  ← Real-time + CRON
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │   Prisma ORM          │
         │   55 Models           │
         │   PostgreSQL          │
         └───────────────────────┘
```

---

## Core Features

### Live Virtual Classroom
- Interactive blackboard with real-time sync
- Chat, Q&A, hand-raising, whisper messages
- Polls and exams with locked answers (anti-cheat)
- Multi-question timed exams auto-save to gradebook
- Prep mode (teachers prepare before going live)
- Video/voice via WebRTC
- 6 board themes, 7 color overrides, student desk/notebook

### Earn-As-You-Teach Payroll
- Teachers earn credits per minute of live teaching
- Auto-calculated from salary / sessions x duration
- Monthly payroll aggregation with tax/pension deductions
- Principal reviews and pays with proof upload
- Prep sessions generate zero credits

### Anti-Cheat Grading
- Exam answers lock after selection
- Per-question countdown timers (10-600 seconds)
- Auto-saves to gradebook as Assessment + Score records
- Principal approval required before grades are visible
- Term report generation with CA (40%) + Exam (60%)

### Smart Timetable
- Principal sets weekly grid per grade
- Auto-generates avoiding teacher conflicts
- Sessions auto-start/end based on timetable
- AM/PM/Evening session slots with timezone support

### 14-Country Education Systems
Nigeria, Kenya, Ghana, South Africa, Tanzania, Uganda, Cameroon, UK, USA, Canada, India, Australia, Pakistan, Egypt — each with correct grade structures, curriculum grouping, and academic calendars.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login + registration (4 roles)
│   ├── (dashboard)/
│   │   ├── principal/       # 17 pages
│   │   ├── teacher/         # 15 pages
│   │   ├── student/         # 15 pages
│   │   └── parent/          # 10 pages
│   ├── api/                 # 12 API endpoints
│   └── gda-nerve-center-*/  # Super admin panel
├── components/              # 16 shared components
├── lib/
│   ├── actions/             # 19 server action files (~100 functions)
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client
│   ├── education-systems.ts # 14-country grade structures
│   └── features.ts          # Feature flag utility
├── middleware.ts             # Role-based route protection
└── prisma/schema.prisma     # 55 models
```

---

## Critical Data Flows

### Session → Credit → Payroll (Money Flow)

```
Timetable slot matches time → auto-session CRON creates LiveClassSession
  → Teacher joins → records joinTime, calculates lateMinutes
  → Session ends → creditTeacher() creates SessionCredit
    → Formula: (baseSalary ÷ totalSessions) × (minutes ÷ sessionLimit)
  → PayrollRecord upserted → grossPay += credit
  → Principal reviews → uploads proof → PAID
```

**Key files:** `api/auto-session/route.ts`, `lib/actions/classroom.ts`

### Exam → Grade → Report Card

```
Teacher creates exam in classroom → students answer (locked on selection)
  → Teacher saves to gradebook → Assessment + Score records
  → Principal approves → grades visible to students/parents
  → Term report generated → TermReport record
```

**Key files:** `lib/actions/grading.ts`, `api/classroom/[sessionId]/route.ts`

---

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/[...nextauth]` | Authentication |
| `/api/auto-session` | CRON: session lifecycle, credits, payroll |
| `/api/classroom/[sessionId]` | Live classroom polling + actions |
| `/api/messages` | Chat conversations + send messages |
| `/api/gda-admin` | Super admin (30+ actions) |
| `/api/maintenance` | Maintenance mode check |
| `/api/support` | Support tickets |
| `/api/unread-count` | Unread message count |
| `/api/notifications` | Notification list |
| `/api/enrollments` | Student enrollment |
| `/api/vacancies` | Public job board |

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=https://www.gdaschools.sbs
GDA_ADMIN_KEY=your-admin-password
```

---

## Setup

```bash
npm install
npx prisma db push
npm run dev
```

## Deploy

Hosted on Vercel with auto-deploy from GitHub.

```bash
git add . && git commit -m "message" && git push
```

**CRON** (`vercel.json`): `/api/auto-session` runs every 2 minutes.

---

## Market

- **TAM:** $640M-$1.1B (600,000+ private schools globally)
- **Africa:** 200,000+ private schools, $140-210M addressable
- **Model:** Per-school subscription ($10-80/month)

---

## License

Proprietary. All rights reserved.
