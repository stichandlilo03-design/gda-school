export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkStudentAccess } from "@/lib/student-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ level: "none" });
  }

  const access = await checkStudentAccess(session.user.id);
  if (!access) return NextResponse.json({ level: "pending" });
  if (!access.isApproved) return NextResponse.json({ level: "pending" });
  if (access.isSuspended) return NextResponse.json({ level: "suspended", access });
  if (!access.feesMet) return NextResponse.json({ level: "awaiting_payment", access });
  return NextResponse.json({ level: "full", access });
}
