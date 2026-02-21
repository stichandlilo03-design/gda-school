import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/homework — get pending homework for current student
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        enrollments: {
          where: { status: "ACTIVE" },
          select: { classId: true, class: { select: { name: true, subject: { select: { name: true } } } } },
        },
        assignmentSubmissions: { select: { assignmentId: true } },
      },
    });
    if (!student) return NextResponse.json({ homework: [] });

    const classIds = student.enrollments.map(e => e.classId);
    const submittedIds = new Set(student.assignmentSubmissions.map(s => s.assignmentId));

    // Get all active assignments from enrolled classes
    const assignments = await db.assignment.findMany({
      where: { classId: { in: classIds }, isActive: true },
      select: {
        id: true, classId: true, title: true, description: true, type: true,
        dueDate: true, maxScore: true, totalPoints: true, questions: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Build class lookup
    const classMap: Record<string, { name: string; subject: string }> = {};
    student.enrollments.forEach(e => {
      classMap[e.classId] = { name: e.class.name, subject: e.class.subject?.name || e.class.name };
    });

    const homework = assignments.map(a => ({
      ...a,
      className: classMap[a.classId]?.name || "",
      subjectName: classMap[a.classId]?.subject || "",
      submitted: submittedIds.has(a.id),
      overdue: a.dueDate ? new Date(a.dueDate) < new Date() : false,
      hasQuestions: !!(a.questions && Array.isArray(a.questions) && (a.questions as any[]).length > 0),
      questionCount: a.questions && Array.isArray(a.questions) ? (a.questions as any[]).length : 0,
    }));

    return NextResponse.json({ homework });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, homework: [] }, { status: 500 });
  }
}
