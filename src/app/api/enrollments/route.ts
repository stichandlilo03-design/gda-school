import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await req.json();

  // Verify student owns this enrollment
  const student = await db.student.findUnique({ where: { id: studentId, userId: session.user.id } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Check class exists and has capacity
  const cls = await db.class.findUnique({
    where: { id: classId },
    include: { enrollments: { where: { status: "ACTIVE" } } },
  });

  if (!cls || !cls.isActive) {
    return NextResponse.json({ error: "Class not found or inactive" }, { status: 404 });
  }

  if (cls.enrollments.length >= cls.maxStudents) {
    return NextResponse.json({ error: "Class is full" }, { status: 400 });
  }

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId, classId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already enrolled in this class" }, { status: 400 });
  }

  // Create enrollment
  const enrollment = await db.enrollment.create({
    data: { studentId, classId, status: "ACTIVE" },
  });

  return NextResponse.json({ success: true, enrollment });
}
