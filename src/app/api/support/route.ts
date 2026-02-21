import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Thread helper: get or build thread from ticket
function getThread(ticket: any): { from: string; text: string; at: string }[] {
  let thread: any[] = [];
  try {
    if (ticket.adminNote) thread = JSON.parse(ticket.adminNote);
  } catch {}
  if (thread.length === 0) {
    thread.push({ from: "principal", text: ticket.message, at: ticket.createdAt });
    if (ticket.adminReply) {
      thread.push({ from: "admin", text: ticket.adminReply, at: ticket.updatedAt || ticket.createdAt });
    }
  }
  return thread;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tickets = await db.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // === FOLLOW-UP REPLY on existing ticket ===
  if (body.action === "reply" && body.ticketId) {
    const ticket = await db.supportTicket.findUnique({ where: { id: body.ticketId } });
    if (!ticket || ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const thread = getThread(ticket);
    thread.push({ from: "principal", text: body.message, at: new Date().toISOString() });

    await db.supportTicket.update({
      where: { id: body.ticketId },
      data: {
        adminNote: JSON.stringify(thread),
        status: ticket.status === "RESOLVED" ? "IN_PROGRESS" : ticket.status, // Reopen if resolved
      },
    });

    await db.systemLog.create({
      data: { level: "INFO", source: "support", message: `Follow-up on ticket "${ticket.subject}" from ${session.user.name}`, userId: session.user.id },
    });

    return NextResponse.json({ ok: true });
  }

  // === CREATE NEW TICKET ===
  let schoolId: string | null = null;
  if (session.user.role === "PRINCIPAL") {
    const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
    schoolId = principal?.schoolId || null;
  }

  // Initialize thread with first message
  const thread = [{ from: "principal", text: body.message, at: new Date().toISOString() }];

  const ticket = await db.supportTicket.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      userRole: session.user.role || "UNKNOWN",
      schoolId,
      subject: body.subject,
      message: body.message,
      priority: body.priority || "NORMAL",
      adminNote: JSON.stringify(thread),
    },
  });

  await db.systemLog.create({
    data: { level: "INFO", source: "support", message: `New ticket: "${body.subject}" from ${session.user.name} (${session.user.role})`, userId: session.user.id },
  });

  return NextResponse.json(ticket);
}
