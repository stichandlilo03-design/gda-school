import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_KEY = process.env.GDA_ADMIN_KEY || "gda-super-admin-2026";

function auth(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  return key === ADMIN_KEY;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const action = req.nextUrl.searchParams.get("action");

  try {
    // ===== DASHBOARD STATS =====
    if (action === "stats") {
      const [schools, teachers, students, parents, sessions, tickets, flags] = await Promise.all([
        db.school.count(),
        db.teacher.count(),
        db.student.count(),
        db.parent.count(),
        db.liveClassSession.count({ where: { status: "IN_PROGRESS" } }),
        db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        db.featureFlag.count(),
      ]);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const [todaySessions, todayUsers, totalRevenue] = await Promise.all([
        db.liveClassSession.count({ where: { startedAt: { gte: todayStart } } }),
        db.user.count({ where: { createdAt: { gte: todayStart } } }),
        db.payrollRecord.aggregate({ _sum: { grossPay: true } }),
      ]);
      const recentLogs = await db.systemLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
      const maintenance = await db.siteConfig.findUnique({ where: { key: "maintenance_mode" } });
      return NextResponse.json({
        schools, teachers, students, parents, liveSessions: sessions, openTickets: tickets, featureFlags: flags,
        todaySessions, todayNewUsers: todayUsers, totalPayroll: totalRevenue._sum.grossPay || 0,
        recentLogs, maintenanceMode: maintenance?.value || { enabled: false, reason: "" },
      });
    }

    // ===== SCHOOLS LIST =====
    if (action === "schools") {
      const schools = await db.school.findMany({
        include: {
          principal: { include: { user: { select: { name: true, email: true } } } },
          _count: { select: { grades: true, teachers: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      // Get student counts per school
      const enriched = await Promise.all(schools.map(async (s) => {
        const studentCount = await db.student.count({ where: { schoolId: s.id } });
        return { ...s, studentCount };
      }));
      return NextResponse.json(enriched);
    }

    // ===== USERS LIST =====
    if (action === "users") {
      const role = req.nextUrl.searchParams.get("role") || undefined;
      const users = await db.user.findMany({
        where: role ? { role: role as any } : undefined,
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, name: true, email: true, role: true, isActive: true, image: true, createdAt: true },
      });
      return NextResponse.json(users);
    }

    // ===== LIVE SESSIONS =====
    if (action === "live_sessions") {
      const sessions = await db.liveClassSession.findMany({
        where: { status: "IN_PROGRESS" },
        include: {
          class: { include: { subject: true, schoolGrade: { include: { school: true } } } },
          teacher: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json(sessions);
    }

    // ===== FEATURE FLAGS =====
    if (action === "features") {
      const flags = await db.featureFlag.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json(flags);
    }

    // ===== SUPPORT TICKETS =====
    if (action === "tickets") {
      const status = req.nextUrl.searchParams.get("status") || undefined;
      const tickets = await db.supportTicket.findMany({
        where: status ? { status } : undefined,
        include: { school: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(tickets);
    }

    // ===== SYSTEM LOGS =====
    if (action === "logs") {
      const level = req.nextUrl.searchParams.get("level") || undefined;
      const source = req.nextUrl.searchParams.get("source") || undefined;
      const logs = await db.systemLog.findMany({
        where: { ...(level ? { level } : {}), ...(source ? { source } : {}) },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return NextResponse.json(logs);
    }

    // ===== PAYROLL OVERVIEW =====
    if (action === "payroll") {
      const records = await db.payrollRecord.findMany({
        include: { schoolTeacher: { include: { teacher: { include: { user: { select: { name: true } } } }, school: { select: { name: true, currency: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(records);
    }

    // ===== HEALTH CHECK =====
    if (action === "health") {
      const checks: Record<string, any> = {};
      // DB
      try { await db.$queryRaw`SELECT 1`; checks.database = { status: "OK", latency: "fast" }; } catch (e: any) { checks.database = { status: "ERROR", error: e.message }; }
      // Counts
      try {
        const [u, s, t] = await Promise.all([db.user.count(), db.school.count(), db.liveClassSession.count({ where: { status: "IN_PROGRESS" } })]);
        checks.data = { users: u, schools: s, liveSessions: t, status: "OK" };
      } catch (e: any) { checks.data = { status: "ERROR", error: e.message }; }
      // ENV
      checks.env = {
        DATABASE_URL: !!process.env.DATABASE_URL ? "SET" : "MISSING",
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
        GDA_ADMIN_KEY: !!process.env.GDA_ADMIN_KEY ? "SET (custom)" : "SET (default)",
        NODE_ENV: process.env.NODE_ENV,
      };
      checks.timestamp = new Date().toISOString();
      checks.uptime = process.uptime();
      return NextResponse.json(checks);
    }

    // ===== ENV CONFIG =====
    if (action === "env") {
      return NextResponse.json({
        DATABASE_URL: process.env.DATABASE_URL ? "***" + process.env.DATABASE_URL.slice(-20) : "NOT SET",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET (" + process.env.NEXTAUTH_SECRET.length + " chars)" : "NOT SET",
        GDA_ADMIN_KEY: process.env.GDA_ADMIN_KEY ? "SET (custom)" : "DEFAULT",
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
        VERCEL_ENV: process.env.VERCEL_ENV || "NOT SET",
      });
    }

    // ===== DB RAW QUERY =====
    if (action === "db_tables") {
      const models = [
        "User", "School", "Principal", "Teacher", "Student", "Parent",
        "SchoolTeacher", "SchoolGrade", "Class", "Subject", "Enrollment",
        "ClassSchedule", "LiveClassSession", "SessionCredit", "AttendanceRecord",
        "Assessment", "Score", "Assignment", "PayrollRecord", "TeacherSalary",
        "FeeStructure", "Payment", "Announcement", "Message",
        "Interview", "Vacancy", "VacancyApplication", "SchoolBankAccount", "TeacherBankAccount",
        "AcademicEvent", "FeatureFlag", "SupportTicket", "SystemLog", "SiteConfig",
        "ClassMaterial", "ParentStudent", "TermReport", "EnrollmentRequest",
        "ClassAnnouncement", "ClassRequirement", "Certificate", "TeacherRating",
        "Term", "SubjectReport", "GradeSubject", "AssignmentSubmission",
      ];
      const counts: Record<string, number> = {};
      for (const m of models) {
        try { counts[m] = await (db as any)[m.charAt(0).toLowerCase() + m.slice(1)].count(); } catch { counts[m] = -1; }
      }
      return NextResponse.json(counts);
    }

    // ===== ADMIN INBOX (Messages to GDA Admin) =====
    if (action === "inbox") {
      let adminUser = await db.user.findFirst({ where: { email: "admin@gdaschools.sbs" } });
      if (!adminUser) return NextResponse.json([]);
      const messages = await db.message.findMany({
        where: { OR: [{ receiverId: adminUser.id }, { senderId: adminUser.id }] },
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, role: true } },
          receiver: { select: { id: true, name: true, role: true } },
        },
        take: 200,
      });
      // Group into conversations
      const convMap = new Map<string, any>();
      for (const msg of messages) {
        const partnerId = msg.senderId === adminUser.id ? msg.receiverId : msg.senderId;
        const partner = msg.senderId === adminUser.id ? msg.receiver : msg.sender;
        if (!convMap.has(partnerId)) {
          const unread = messages.filter(m => m.senderId === partnerId && m.receiverId === adminUser!.id && !m.isRead).length;
          convMap.set(partnerId, { partnerId, partner, lastMessage: msg, unread, messages: [] });
        }
        convMap.get(partnerId).messages.push(msg);
      }
      return NextResponse.json({ conversations: Array.from(convMap.values()), adminUserId: adminUser.id });
    }

    // ===== ADMIN UNREAD COUNT =====
    if (action === "unread") {
      let adminUser = await db.user.findFirst({ where: { email: "admin@gdaschools.sbs" } });
      if (!adminUser) return NextResponse.json({ messages: 0, tickets: 0 });
      const [unreadMsgs, openTickets] = await Promise.all([
        db.message.count({ where: { receiverId: adminUser.id, isRead: false } }),
        db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      ]);
      return NextResponse.json({ messages: unreadMsgs, tickets: openTickets });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  try {
    // ===== MAINTENANCE MODE =====
    if (action === "set_maintenance") {
      const { enabled, reason } = body;
      await db.siteConfig.upsert({
        where: { key: "maintenance_mode" },
        update: { value: { enabled, reason: reason || "System maintenance in progress" } },
        create: { key: "maintenance_mode", value: { enabled, reason: reason || "System maintenance in progress" } },
      });
      await db.systemLog.create({ data: { level: "WARN", source: "admin", message: enabled ? `Maintenance mode ENABLED: ${reason}` : "Maintenance mode DISABLED" } });
      return NextResponse.json({ ok: true });
    }

    // ===== TOGGLE USER ACTIVE =====
    if (action === "toggle_user") {
      const user = await db.user.findUnique({ where: { id: body.userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      await db.user.update({ where: { id: body.userId }, data: { isActive: !user.isActive } });
      await db.systemLog.create({ data: { level: "WARN", source: "admin", message: `User ${user.email} ${user.isActive ? "DEACTIVATED" : "ACTIVATED"}`, userId: body.userId } });
      return NextResponse.json({ ok: true, isActive: !user.isActive });
    }

    // ===== DELETE USER =====
    if (action === "delete_user") {
      const user = await db.user.findUnique({ where: { id: body.userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      await db.user.delete({ where: { id: body.userId } });
      await db.systemLog.create({ data: { level: "CRITICAL", source: "admin", message: `User DELETED: ${user.email} (${user.role})` } });
      return NextResponse.json({ ok: true });
    }

    // ===== DELETE SCHOOL =====
    if (action === "delete_school") {
      const school = await db.school.findUnique({ where: { id: body.schoolId } });
      if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });
      await db.school.delete({ where: { id: body.schoolId } });
      await db.systemLog.create({ data: { level: "CRITICAL", source: "admin", message: `School DELETED: ${school.name}` } });
      return NextResponse.json({ ok: true });
    }

    // ===== FEATURE FLAG CRUD =====
    if (action === "create_feature") {
      const flag = await db.featureFlag.create({ data: { key: body.key, name: body.name, description: body.description, category: body.category || "general", config: body.config || {} } });
      await db.systemLog.create({ data: { level: "INFO", source: "admin", message: `Feature created: ${body.name} (${body.key})` } });
      return NextResponse.json(flag);
    }
    if (action === "toggle_feature") {
      const flag = await db.featureFlag.findUnique({ where: { id: body.featureId } });
      if (!flag) return NextResponse.json({ error: "Feature not found" }, { status: 404 });
      await db.featureFlag.update({ where: { id: body.featureId }, data: { published: !flag.published } });
      await db.systemLog.create({ data: { level: "WARN", source: "admin", message: `Feature ${flag.name} ${flag.published ? "UNPUBLISHED" : "PUBLISHED"}` } });
      return NextResponse.json({ ok: true, published: !flag.published });
    }
    if (action === "delete_feature") {
      await db.featureFlag.delete({ where: { id: body.featureId } });
      return NextResponse.json({ ok: true });
    }
    if (action === "update_feature_config") {
      await db.featureFlag.update({ where: { id: body.featureId }, data: { config: body.config } });
      return NextResponse.json({ ok: true });
    }

    // ===== SUPPORT TICKETS =====
    if (action === "reply_ticket") {
      await db.supportTicket.update({ where: { id: body.ticketId }, data: { adminReply: body.reply, status: body.close ? "RESOLVED" : "IN_PROGRESS", resolvedAt: body.close ? new Date() : undefined, adminNote: body.note } });
      // Notify the user
      const ticket = await db.supportTicket.findUnique({ where: { id: body.ticketId } });
      if (ticket) {
        await db.systemLog.create({ data: { level: "INFO", source: "support", message: `Ticket "${ticket.subject}" ${body.close ? "resolved" : "replied to"}`, userId: ticket.userId } });
      }
      return NextResponse.json({ ok: true });
    }
    if (action === "close_ticket") {
      await db.supportTicket.update({ where: { id: body.ticketId }, data: { status: "CLOSED" } });
      return NextResponse.json({ ok: true });
    }

    // ===== BROADCAST MESSAGE =====
    if (action === "broadcast") {
      const { target, title, message } = body;
      let where: any = {};
      if (target === "principals") where = { role: "PRINCIPAL" };
      else if (target === "teachers") where = { role: "TEACHER" };
      else if (target === "students") where = { role: "STUDENT" };
      else if (target === "parents") where = { role: "PARENT" };
      const users = await db.user.findMany({ where, select: { id: true } });
      // Get or create GDA Admin system user
      let adminUser = await db.user.findFirst({ where: { email: "admin@gdaschools.sbs" } });
      if (!adminUser) {
        adminUser = await db.user.create({
          data: { name: "GDA Admin", email: "admin@gdaschools.sbs", role: "SUPER_ADMIN", isActive: true },
        });
      } else if ((adminUser as any).role !== "SUPER_ADMIN") {
        await db.user.update({ where: { id: adminUser.id }, data: { role: "SUPER_ADMIN", name: "GDA Admin" } });
      }
      let count = 0;
      for (const u of users) {
        if (u.id === adminUser.id) continue;
        try {
          await db.message.create({ data: { senderId: adminUser.id, receiverId: u.id, subject: `📢 ${title || "System Announcement"}`, content: message } });
          count++;
        } catch {}
      }
      await db.systemLog.create({ data: { level: "INFO", source: "admin", message: `Broadcast sent to ${count} ${target} users: ${title}` } });
      return NextResponse.json({ ok: true, sent: count });
    }

    // ===== FORCE END ALL SESSIONS =====
    if (action === "force_end_sessions") {
      const updated = await db.liveClassSession.updateMany({
        where: { status: { in: ["IN_PROGRESS", "WAITING"] } },
        data: { status: "ENDED", endedAt: new Date() },
      });
      await db.systemLog.create({ data: { level: "CRITICAL", source: "admin", message: `Force-ended ${updated.count} live sessions` } });
      return NextResponse.json({ ok: true, ended: updated.count });
    }

    // ===== CLEAR LOGS =====
    if (action === "clear_logs") {
      const cutoff = new Date(Date.now() - (body.days || 30) * 86400000);
      const deleted = await db.systemLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
      return NextResponse.json({ ok: true, deleted: deleted.count });
    }

    // ===== ADD LOG =====
    if (action === "add_log") {
      await db.systemLog.create({ data: { level: body.level || "INFO", source: body.source || "admin", message: body.message, meta: body.meta } });
      return NextResponse.json({ ok: true });
    }

    // ===== SEED FEATURE FLAGS =====
    if (action === "seed_features") {
      const features = [
        { key: "subscription_plans", name: "Subscription Plans", description: "Monthly/yearly subscription tiers for principals (Free, Starter, Growth, Enterprise)", category: "billing" },
        { key: "ai_tutoring", name: "AI Tutoring", description: "AI-powered student tutoring assistant after class sessions", category: "classroom" },
        { key: "sms_notifications", name: "SMS Notifications", description: "Send class reminders and alerts via SMS to parents and teachers", category: "communication" },
        { key: "offline_mode", name: "Offline Mode", description: "Allow classroom tools to work without internet, sync when connected", category: "classroom" },
        { key: "mobile_app_download", name: "Mobile App Download", description: "Show mobile app download links on dashboard and landing page", category: "general" },
        { key: "marketplace", name: "Content Marketplace", description: "Teachers sell lesson plans, principals buy curriculum packages", category: "billing" },
        { key: "advanced_analytics", name: "Advanced Analytics", description: "Detailed school performance analytics, predictive insights, and AI-generated recommendations", category: "general" },
        { key: "multi_campus", name: "Multi-Campus Management", description: "Allow one principal to manage multiple school branches from a single dashboard", category: "general" },
        { key: "student_study_groups", name: "Student Study Groups", description: "Student-to-student collaboration features: study groups, peer tutoring, shared notes", category: "classroom" },
        { key: "parent_payment_gateway", name: "Online Payment Gateway", description: "Direct online fee payment via Paystack/Flutterwave/Stripe for parents", category: "billing" },
        { key: "video_recording", name: "Session Recording", description: "Record live classroom sessions for playback. Students who missed class can watch later.", category: "classroom" },
        { key: "custom_branding", name: "Custom School Branding", description: "Schools can upload logos, set colors, and customize the look of their portal", category: "general" },
      ];
      let created = 0;
      for (const f of features) {
        try { await db.featureFlag.create({ data: f }); created++; } catch { /* already exists */ }
      }
      return NextResponse.json({ ok: true, created });
    }

    // ===== ADMIN REPLY TO MESSAGE =====
    if (action === "admin_reply") {
      let adminUser = await db.user.findFirst({ where: { email: "admin@gdaschools.sbs" } });
      if (!adminUser) {
        adminUser = await db.user.create({ data: { name: "GDA Admin", email: "admin@gdaschools.sbs", role: "SUPER_ADMIN", isActive: true } });
      }
      await db.message.create({ data: { senderId: adminUser.id, receiverId: body.receiverId, subject: body.subject || null, content: body.content } });
      await db.message.updateMany({ where: { senderId: body.receiverId, receiverId: adminUser.id, isRead: false }, data: { isRead: true } });
      return NextResponse.json({ ok: true });
    }

    // ===== ADMIN MARK CONVERSATION READ =====
    if (action === "admin_mark_read") {
      let adminUser = await db.user.findFirst({ where: { email: "admin@gdaschools.sbs" } });
      if (!adminUser) return NextResponse.json({ ok: true });
      await db.message.updateMany({ where: { senderId: body.partnerId, receiverId: adminUser.id, isRead: false }, data: { isRead: true } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
