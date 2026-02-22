import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkStudentAccess } from "@/lib/student-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not logged in" });

  try {
    // Call the ACTUAL function used by layout and pages
    const access = await checkStudentAccess(session.user.id);
    return NextResponse.json({
      userId: session.user.id,
      role: session.user.role,
      access,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
