"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";

const reval = () => { revalidatePath("/principal/students"); revalidatePath("/principal"); };

// Approve student
export async function approveStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.update({ where: { id: studentId }, data: { approvalStatus: "APPROVED" }, include: { school: true } });
  await notify(student.userId, "🎉 Enrollment Approved!", `Welcome to ${student.school.name}! Your enrollment has been approved. You can now browse subjects and join classes.`);
  reval(); return { success: true };
}

// Reject student
export async function rejectStudent(studentId: string, reason?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.update({ where: { id: studentId }, data: { approvalStatus: "REJECTED" } });
  await notify(student.userId, "❌ Enrollment Not Approved", `Your enrollment application was not approved.${reason ? ` Reason: ${reason}` : ""} Please contact the school for more information.`);
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
  await notify(student.userId, "⚠️ Account Suspended", `Your account has been suspended. Reason: ${reason}. Contact your school principal.`);
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

  const student = await db.student.update({
    where: { id: studentId },
    data: { gradeLevel: newGrade as any, promotionNote: note || `Promoted to ${newGrade}` },
  });
  await notify(student.userId, "🎓 Grade Promotion!", `Congratulations! You have been promoted to ${newGrade}. Your new classes and subjects are now available.`);
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

// ===== TEACHER CLASS MANAGEMENT =====

// Teacher removes student from their class
export async function removeStudentFromClass(enrollmentId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { class: true, student: { include: { user: true } } },
  });
  if (!enrollment) return { error: "Enrollment not found" };

  // Verify teacher owns the class
  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher || enrollment.class.teacherId !== teacher.id) return { error: "Not your class" };

  await db.enrollment.update({ where: { id: enrollmentId }, data: { status: "WITHDRAWN" } });

  // Notify student
  await notify(
    enrollment.student.userId,
    "📢 Removed from Class",
    `You have been removed from ${enrollment.class.name} by your teacher. Reason: ${reason || "No reason provided"}. Contact your teacher or principal if you have questions.`
  );

  // Notify principal
  const schoolGrade = await db.schoolGrade.findFirst({ where: { id: enrollment.class.schoolGradeId || "" }, include: { school: true } });
  if (schoolGrade?.school) {
    const principal = await db.principal.findFirst({ where: { schoolId: schoolGrade.school.id } });
    if (principal) {
      await notify(
        principal.userId,
        "📋 Student Removed from Class",
        `Teacher ${session.user.name} removed student ${enrollment.student.user.name} from ${enrollment.class.name}. Reason: ${reason}`
      );
    }
  }

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/subjects");
  return { success: true };
}

// ===== TEACHER RATING SYSTEM =====

export async function rateTeacher(data: {
  teacherId: string;
  sessionId?: string;
  classId?: string;
  rating: number;
  comment?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return { error: "Student not found" };

  if (data.rating < 1 || data.rating > 5) return { error: "Rating must be 1-5" };

  // Check if already rated this session
  if (data.sessionId) {
    const existing = await db.teacherRating.findUnique({
      where: { teacherId_studentId_sessionId: { teacherId: data.teacherId, studentId: student.id, sessionId: data.sessionId } },
    });
    if (existing) return { error: "Already rated this session" };
  }

  await db.teacherRating.create({
    data: {
      teacherId: data.teacherId,
      studentId: student.id,
      sessionId: data.sessionId,
      classId: data.classId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  // Recalculate teacher average rating
  const allRatings = await db.teacherRating.findMany({ where: { teacherId: data.teacherId }, select: { rating: true } });
  const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
  await db.teacher.update({
    where: { id: data.teacherId },
    data: { rating: Math.round(avg * 10) / 10, totalRatings: allRatings.length },
  });

  revalidatePath("/student/classroom");
  revalidatePath("/teacher");
  return { success: true };
}

// ===== PRINCIPAL TEACHER MANAGEMENT =====

export async function assignTeacherToClass(teacherId: string, schoolGradeId: string, subjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id }, include: { school: true } });
  if (!principal) return { error: "Not found" };

  const subject = await db.subject.findUnique({ where: { id: subjectId } });
  const grade = await db.schoolGrade.findUnique({ where: { id: schoolGradeId } });
  if (!subject || !grade) return { error: "Subject or grade not found" };

  // Check if class already exists
  const existing = await db.class.findFirst({
    where: { teacherId, schoolGradeId, subjectId },
  });
  if (existing) return { error: "Teacher already has this class" };

  const newClass = await db.class.create({
    data: {
      teacherId, schoolGradeId, subjectId,
      name: `${subject.name} - ${grade.gradeLevel}`,
      session: "SESSION_A", maxStudents: 40,
    },
  });

  // Notify teacher
  const teacher = await db.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
  if (teacher) {
    await notify(teacher.userId, "📚 New Class Assigned", `You've been assigned to teach ${subject.name} for ${grade.gradeLevel}. Check your Classroom!`);
  }

  // Notify students in grade
  const students = await db.student.findMany({
    where: { schoolId: principal.schoolId, gradeLevel: grade.gradeLevel, approvalStatus: "APPROVED" },
    select: { userId: true },
  });
  if (students.length > 0) {
    await Promise.all(students.map(s => notify(s.userId, "📚 New Class Available", `A new ${subject.name} class is available for your grade. Check Subjects to enroll!`)));
  }

  revalidatePath("/principal/teachers");
  revalidatePath("/teacher/classroom");
  revalidatePath("/student/subjects");
  return { success: true, classId: newClass.id };
}

export async function removeTeacherFromSchool(schoolTeacherId: string, reason?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const st = await db.schoolTeacher.findUnique({ where: { id: schoolTeacherId }, include: { teacher: true, school: true } });
  if (!st) return { error: "Not found" };

  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { isActive: false, status: "REJECTED" } });

  await notify(st.teacher.userId, "⚠️ Removed from School", `You have been removed from ${st.school.name}.${reason ? ` Reason: ${reason}` : ""}`);

  revalidatePath("/principal/teachers");
  return { success: true };
}
