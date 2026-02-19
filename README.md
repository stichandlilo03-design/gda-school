# Global Digital Academy (GDA) 🎓

A fully digital online school platform — from Kindergarten to Senior Secondary. Built with Next.js 15, Prisma, PostgreSQL, and Tailwind CSS.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/gda-school.git
cd gda-school
npm install
```

### 2. Set Up Database

**Recommended: [Neon](https://neon.tech)** (serverless PostgreSQL, perfect for Vercel)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project → copy the connection string
3. Create `.env` from the template:

```bash
cp .env.example .env
```

4. Paste your database URL:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/gda_school?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/gda_school?sslmode=require"
```

### 3. Generate Auth Secret
```bash
openssl rand -base64 32
```
Paste the output as `NEXTAUTH_SECRET` in `.env`.

### 4. Push Database Schema
```bash
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🌐 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - GDA School Platform"
git remote add origin https://github.com/YOUR_USERNAME/gda-school.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add all environment variables from `.env`
4. Set `NEXTAUTH_URL` to your Vercel domain (e.g., `https://gda-school.vercel.app`)
5. Deploy!

### Step 3: Run Database Migration on Vercel
After deploy, open the Vercel terminal or run locally:
```bash
npx prisma db push
```

---

## 🗄️ Production Database Options

| Provider | Type | Free Tier | Best For |
|----------|------|-----------|----------|
| **[Neon](https://neon.tech)** ⭐ | Serverless PostgreSQL | 0.5GB, 190 compute hrs | Vercel deployment |
| **[Supabase](https://supabase.com)** | PostgreSQL + Auth + Storage | 500MB, 2 projects | All-in-one solution |
| **[Railway](https://railway.app)** | Managed PostgreSQL | $5/mo credit | Simple hosting |
| **[PlanetScale](https://planetscale.com)** | MySQL (Vitess) | 5GB, 1B row reads | High-scale apps |

### Additional Services

| Service | Purpose | Recommended Provider |
|---------|---------|---------------------|
| **File Storage** | Materials, recordings | [Uploadthing](https://uploadthing.com) or [Cloudflare R2](https://developers.cloudflare.com/r2) |
| **Payments** | School fees | [Stripe](https://stripe.com) + [Paystack](https://paystack.com) (Africa) |
| **Email** | Notifications | [Resend](https://resend.com) |
| **Redis** | Caching, sessions | [Upstash](https://upstash.com) |
| **Video** | Live classes | [Agora](https://agora.io) or [Jitsi](https://jitsi.org) |

---

## 📁 Project Structure

```
gda-school/
├── prisma/
│   └── schema.prisma          # Full database schema (30+ models)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── (auth)/
│   │   │   ├── login/          # Login page
│   │   │   └── register/
│   │   │       ├── student/    # Student registration (3-step)
│   │   │       ├── teacher/    # Teacher application (2-step)
│   │   │       └── principal/  # School creation + principal registration
│   │   ├── (dashboard)/
│   │   │   ├── student/        # Student portal (7 pages)
│   │   │   ├── teacher/        # Teacher portal (7 pages)
│   │   │   └── principal/      # Principal portal (7 pages)
│   │   └── api/
│   │       ├── auth/           # NextAuth.js
│   │       └── enrollments/    # Enrollment API
│   ├── components/
│   │   ├── layout/             # Sidebar, header
│   │   └── providers.tsx       # Session provider
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── utils.ts            # Utility functions
│   │   ├── validations.ts      # Zod schemas
│   │   └── actions/
│   │       └── auth.ts         # Server actions (register)
│   └── middleware.ts           # Route protection
├── .env.example                # All environment variables documented
├── package.json
└── README.md
```

---

## 🔐 User Roles

| Role | Registration | Portal | Key Features |
|------|-------------|--------|--------------|
| **Student** | Self-register | `/student` | Choose teachers, attend classes, view grades, earn certificates |
| **Teacher** | Apply (admin approval) | `/teacher` | Manage classes, gradebook, attendance, materials |
| **Principal** | Creates school | `/principal` | Full school management, fees, curriculum, hire/fire |

---

## 🗃️ Database Schema Highlights

- **30+ models** covering every aspect of school operations
- **Role-based users** with Student, Teacher, Principal profiles
- **Multi-school** architecture — each principal runs their own school
- **Country-adaptive** curriculum with grade mapping
- **3-session scheduling** (Morning/Afternoon/Evening)
- **Full assessment pipeline** (CA → Mid-Term → End-of-Term → Project)
- **Payment tracking** with multi-currency support
- **Blockchain-ready certificates** with verification codes

---

## 🛠️ Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx prisma studio    # Open database GUI
npx prisma db push   # Push schema changes
npx prisma migrate dev # Create migration
```

---

## 📋 Next Steps (Build Roadmap)

### Phase 1 — Core Functionality
- [ ] Flesh out teacher class creation UI
- [ ] Build full gradebook with score entry
- [ ] Implement attendance marking system
- [ ] Build timetable generator
- [ ] Principal teacher management (approve/reject/terminate)

### Phase 2 — Classroom Engine
- [ ] Integrate Agora/Jitsi for live video classes
- [ ] Build virtual classroom UI (seating, whiteboard, chat)
- [ ] Add class recording and playback
- [ ] Implement 3x daily session rotation

### Phase 3 — Assessment & Payments
- [ ] Build assessment creation and grading UI
- [ ] Integrate Stripe + Paystack payments
- [ ] Generate report cards (PDF)
- [ ] Certificate generation with QR verification

### Phase 4 — Polish
- [ ] Mobile responsive refinement
- [ ] Email notifications (Resend)
- [ ] Parent portal
- [ ] School branding (logo, colors, anthem upload)
- [ ] Admin super-admin panel

---

## License

Proprietary. All rights reserved.
