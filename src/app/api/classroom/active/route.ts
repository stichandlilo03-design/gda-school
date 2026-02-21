import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/classroom/active?classId=xxx
// Returns the current active session for a class (if any)
export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return NextResponse.json({ session: null });

  const session = await db.liveClassSession.findFirst({
    where: { classId, status: "IN_PROGRESS" },
    select: {
      id: true, status: true, isPrep: true, topic: true, startedAt: true,
      teacherId: true, durationMin: true,
      teacher: { select: { user: { select: { name: true } } } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ session: session || null });
}
