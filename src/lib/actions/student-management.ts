"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const reval = () => { revalidatePath("/principal/students"); revalidatePath("/principal"); };

// Approve student
export async function approveStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.student.update({ where: { id: studentId }, data: { approvalStatus: "APPROVED" } });
  reval(); return { success: true };
}

// Reject student
export async function rejectStudent(studentId: string, reason?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.student.update({ where: { id: studentId }, data: { approvalStatus: "REJECTED" } });
  reval(); return { success: true };
}

// Suspend student with reason and optional duration
export async function suspendStudent(studentId: string, reason: string, untilDate?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  await db.student.update({
    where: { id: studentId },
    data: {
      isSuspended: true,
      suspendedAt: new Date(),
      suspendReason: reason,
      suspendUntil: untilDate ? new Date(untilDate) : null,
    },
  });
  await db.user.update({ where: { id: student.userId }, data: { isActive: false } });
  reval(); return { success: true };
}

// Unsuspend / lift suspension
export async function unsuspendStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  await db.student.update({
    where: { id: studentId },
    data: { isSuspended: false, suspendedAt: null, suspendReason: null, suspendUntil: null },
  });
  await db.user.update({ where: { id: student.userId }, data: { isActive: true } });
  reval(); return { success: true };
}

// Expel student (permanent removal)
export async function expelStudent(studentId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  // Deactivate all enrollments
  await db.enrollment.updateMany({
    where: { studentId, status: "ACTIVE" },
    data: { status: "WITHDRAWN" },
  });

  await db.student.update({
    where: { id: studentId },
    data: { isExpelled: true, expelledAt: new Date(), expelReason: reason },
  });
  await db.user.update({ where: { id: student.userId }, data: { isActive: false } });
  reval(); return { success: true };
}

// Reinstate expelled student
export async function reinstateStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  await db.student.update({
    where: { id: studentId },
    data: { isExpelled: false, expelledAt: null, expelReason: null, isSuspended: false, suspendedAt: null, suspendReason: null },
  });
  await db.user.update({ where: { id: student.userId }, data: { isActive: true } });
  reval(); return { success: true };
}

// Promote student to next grade
export async function promoteStudent(studentId: string, newGrade: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.student.update({
    where: { id: studentId },
    data: { gradeLevel: newGrade as any, promotionNote: note || `Promoted to ${newGrade}` },
  });
  reval(); return { success: true };
}

// Change student grade without promotion context
export async function changeStudentGrade(studentId: string, newGrade: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.student.update({ where: { id: studentId }, data: { gradeLevel: newGrade as any } });
  reval(); return { success: true };
}

// Send message to student
export async function sendMessageToStudent(studentUserId: string, subject: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await db.message.create({
    data: { senderId: session.user.id, receiverId: studentUserId, subject, content },
  });
  return { success: true };
}

// Get conversation with a student
export async function getStudentConversation(studentUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized", messages: [] };

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: studentUserId },
        { senderId: studentUserId, receiverId: session.user.id },
      ],
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  await db.message.updateMany({
    where: { senderId: studentUserId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { messages };
}

// Bulk approve eligible students
export async function bulkApproveStudents(studentIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  for (const id of studentIds) {
    await db.student.update({ where: { id }, data: { approvalStatus: "APPROVED" } });
  }
  reval(); return { success: true, count: studentIds.length };
}
