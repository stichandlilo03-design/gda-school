import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkStudentAccess } from "@/lib/student-access";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ tier: "pending" }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }

  try {
    const access = await checkStudentAccess(session.user.id);
    
    let tier = "pending";
    if (!access) {
      tier = "pending";
    } else if (!access.isApproved) {
      tier = "pending";
    } else if (!access.feesMet) {
      tier = "awaiting_payment";
    } else {
      // Check if in active class
      const student = await db.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (student) {
        const activeSession = await db.liveClassSession.findFirst({
          where: {
            status: "IN_PROGRESS",
            class: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } },
          },
          select: { id: true },
        });
        tier = activeSession ? "in_class" : "full";
      } else {
        tier = "full";
      }
    }

    return NextResponse.json(
      { tier, access },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" } }
    );
  } catch (_e) {
    return NextResponse.json(
      { tier: "full" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
