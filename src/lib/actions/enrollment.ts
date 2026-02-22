"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// STUDENT: Request to enroll in a class
// ============================================================
export async function requestEnrollment(classId: string, message?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return { error: "Student not found" };
  if (student.approvalStatus !== "APPROVED") return { error: "Your school admission must be approved first." };

  const cls = await db.class.findUnique({
    where: { id: classId },
    include: { _count: { select: { enrollments: true } }, enrollments: { where: { studentId: student.id } } },
  });
  if (!cls) return { error: "Class not found" };
  if (cls.enrollments.length > 0) return { error: "Already enrolled in this class." };
  if (cls._count.enrollments >= cls.maxStudents) return { error: "Class is full." };

  // Check for existing request
  const existing = await db.enrollmentRequest.findUnique({
    where: { studentId_classId: { studentId: student.id, classId } },
  });
  if (existing) return { error: "You already have a pending request for this class." };

  await db.enrollmentRequest.create({
    data: { studentId: student.id, classId, message: message || null, status: "PENDING" },
  });

  // Notify the teacher
  try {
    const classData = await db.class.findUnique({
      where: { id: classId },
      include: { teacher: { select: { userId: true } }, subject: { select: { name: true } } },
    });
    if (classData?.teacher?.userId) {
      const { notify } = await import("@/lib/notifications");
      await notify(classData.teacher.userId,
        "📚 New Enrollment Request",
        `${session.user.name || "A student"} wants to join your ${classData.subject?.name || "class"}. Please review in your Classes page.`
      );
    }
  } catch (_e) {}

  revalidatePath("/student/teachers");
  revalidatePath("/teacher");
  return { success: true, message: "Enrollment request sent! The teacher will review your request." };
}

// ============================================================
// TEACHER: Approve enrollment request
// ============================================================
export async function approveEnrollmentRequest(requestId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const req = await db.enrollmentRequest.findUnique({
    where: { id: requestId },
    include: { class: true, student: true },
  });
  if (!req) return { error: "Request not found" };

  // Verify teacher owns the class
  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher || req.class.teacherId !== teacher.id) return { error: "Not your class" };

  // Create actual enrollment
  await db.enrollment.create({
    data: { studentId: req.studentId, classId: req.classId },
  });

  await db.enrollmentRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  // Notify student
  try {
    const { notify } = await import("@/lib/notifications");
    await notify(req.student.userId,
      "✅ Enrollment Approved!",
      `You've been enrolled in ${req.class.name}. You can now attend classes and submit assignments.`
    );
  } catch (_e) {}

  revalidatePath("/teacher");
  revalidatePath("/teacher/classes");
  revalidatePath("/student");
  return { success: true };
}

// ============================================================
// TEACHER: Decline enrollment request
// ============================================================
export async function declineEnrollmentRequest(requestId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const req = await db.enrollmentRequest.findUnique({
    where: { id: requestId },
    include: { class: true },
  });
  if (!req) return { error: "Request not found" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher || req.class.teacherId !== teacher.id) return { error: "Not your class" };

  await db.enrollmentRequest.update({
    where: { id: requestId },
    data: { status: "DECLINED" },
  });

  revalidatePath("/teacher");
  return { success: true };
}
