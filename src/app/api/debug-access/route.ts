export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkStudentAccess } from "@/lib/student-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not logged in" });

  const access = await checkStudentAccess(session.user.id);
  if (!access) return NextResponse.json({ error: "No student record", userId: session.user.id });

  return NextResponse.json({
    userId: session.user.id,
    access,
    sidebarWouldBe: !access.isApproved ? "PENDING (4 links)" :
      access.isSuspended ? "SUSPENDED (5 links)" :
      !access.feesMet ? "AWAITING_PAYMENT (5 links)" :
      "FULL ACCESS (16 links)",
    timestamp: new Date().toISOString(),
  });
}
