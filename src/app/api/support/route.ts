import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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

  let schoolId: string | null = null;
  if (session.user.role === "PRINCIPAL") {
    const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
    schoolId = principal?.schoolId || null;
  }

  const ticket = await db.supportTicket.create({
    data: {
      userId: session.user.id,
      userName: session.user.name || "User",
      userRole: session.user.role || "UNKNOWN",
      schoolId,
      subject: body.subject,
      message: body.message,
      priority: body.priority || "NORMAL",
    },
  });

  await db.systemLog.create({
    data: { level: "INFO", source: "support", message: `New ticket: "${body.subject}" from ${session.user.name} (${session.user.role})`, userId: session.user.id },
  });

  return NextResponse.json(ticket);
}
