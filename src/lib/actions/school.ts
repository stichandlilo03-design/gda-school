"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// TEACHER APPROVAL
// ============================================================
export async function inviteTeacherToSchool(teacherEmail: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const user = await db.user.findUnique({ where: { email: teacherEmail.toLowerCase() }, include: { teacher: true } });
  if (!user || !user.teacher) return { error: "Teacher not found. They must register first." };

  const existing = await db.schoolTeacher.findUnique({
    where: { teacherId_schoolId: { teacherId: user.teacher.id, schoolId: principal.schoolId } },
  });
  if (existing) {
    if (existing.status === "APPROVED" && existing.isActive) return { error: "Already in your school." };
    await db.schoolTeacher.update({ where: { id: existing.id }, data: { status: "APPROVED", isActive: true, isSuspended: false, terminatedAt: null, requestedBy: "PRINCIPAL" } });
    revalidatePath("/principal/teachers"); return { success: true, message: "Teacher re-added!" };
  }

  await db.schoolTeacher.create({ data: { teacherId: user.teacher.id, schoolId: principal.schoolId, status: "APPROVED", isActive: true, requestedBy: "PRINCIPAL" } });
  revalidatePath("/principal/teachers"); return { success: true, message: "Teacher added!" };
}

export async function approveTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { status: "APPROVED", isActive: true } });
  revalidatePath("/principal/teachers"); revalidatePath("/principal"); return { success: true };
}

export async function rejectTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { status: "REJECTED", isActive: false } });
  revalidatePath("/principal/teachers"); return { success: true };
}

// ============================================================
// SUSPEND TEACHER — dashboard only, no classroom access
// ============================================================
export async function suspendTeacher(schoolTeacherId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({
    where: { id: schoolTeacherId },
    data: { isSuspended: true, suspendedAt: new Date(), suspendReason: reason },
  });

  revalidatePath("/principal/teachers"); return { success: true };
}

export async function unsuspendTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({
    where: { id: schoolTeacherId },
    data: { isSuspended: false, suspendedAt: null, suspendReason: null },
  });

  revalidatePath("/principal/teachers"); return { success: true };
}

// ============================================================
// TERMINATE TEACHER — permanent, dashboard only
// ============================================================
export async function terminateTeacher(schoolTeacherId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  // Deactivate all their classes
  const st = await db.schoolTeacher.findUnique({ where: { id: schoolTeacherId }, include: { teacher: true } });
  if (st) {
    await db.class.updateMany({
      where: { teacherId: st.teacherId, schoolGrade: { schoolId: st.schoolId } },
      data: { isActive: false },
    });
  }

  await db.schoolTeacher.update({
    where: { id: schoolTeacherId },
    data: { isActive: false, terminatedAt: new Date(), terminateReason: reason, isSuspended: false },
  });

  revalidatePath("/principal/teachers"); return { success: true };
}

export async function reinstateTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({
    where: { id: schoolTeacherId },
    data: { isActive: true, isSuspended: false, terminatedAt: null, terminateReason: null, suspendedAt: null, suspendReason: null, status: "APPROVED" },
  });

  revalidatePath("/principal/teachers"); return { success: true };
}

export async function removeTeacherFromSchool(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { isActive: false } });
  revalidatePath("/principal/teachers"); return { success: true };
}

// ============================================================
// ASSIGN TEACHER TO CLASS
// ============================================================
export async function assignTeacherToClass(data: {
  teacherId: string;
  schoolGradeId: string;
  subjectName: string;
  className: string;
  session: string;
  maxStudents?: number;
  description?: string;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: sess.user.id } });
  if (!principal) return { error: "Principal not found" };

  // Find or create subject
  const code = data.subjectName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  let subject = await db.subject.findFirst({ where: { name: data.subjectName } });
  if (!subject) {
    subject = await db.subject.create({ data: { name: data.subjectName, code: code + Date.now().toString().slice(-4) } });
  }

  const cls = await db.class.create({
    data: {
      teacherId: data.teacherId,
      schoolGradeId: data.schoolGradeId,
      subjectId: subject.id,
      name: data.className,
      description: data.description,
      session: data.session as any,
      maxStudents: data.maxStudents || 40,
    },
  });

  revalidatePath("/principal/teachers"); revalidatePath("/teacher"); return { success: true, classId: cls.id };
}

// Reassign a class to a different teacher
export async function reassignClass(classId: string, newTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.class.update({ where: { id: classId }, data: { teacherId: newTeacherId } });
  revalidatePath("/principal/teachers"); revalidatePath("/teacher"); return { success: true };
}

// Deactivate a class
export async function deactivateClass(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.class.update({ where: { id: classId }, data: { isActive: false } });
  revalidatePath("/principal/teachers"); return { success: true };
}

// Reactivate a class
export async function reactivateClass(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.class.update({ where: { id: classId }, data: { isActive: true } });
  revalidatePath("/principal/teachers"); return { success: true };
}

// Update assigned subjects for a teacher
export async function updateTeacherSubjects(schoolTeacherId: string, subjects: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { assignedSubjects: subjects } });
  revalidatePath("/principal/teachers"); return { success: true };
}

// ============================================================
// PRINCIPAL → TEACHER MESSAGING
// ============================================================
export async function sendMessageToTeacher(teacherUserId: string, subject: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.message.create({
    data: { senderId: session.user.id, receiverId: teacherUserId, subject, content },
  });

  revalidatePath("/principal/teachers"); return { success: true };
}

export async function getTeacherConversation(teacherUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: teacherUserId },
        { senderId: teacherUserId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });

  // Mark unread as read
  await db.message.updateMany({
    where: { senderId: teacherUserId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { messages };
}

// ============================================================
// STUDENT MANAGEMENT (unchanged)
// ============================================================
export async function approveStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.student.update({ where: { id: studentId }, data: { approvalStatus: "APPROVED" } });
  revalidatePath("/principal/students"); revalidatePath("/principal"); return { success: true };
}

export async function rejectStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.student.update({ where: { id: studentId }, data: { approvalStatus: "REJECTED" } });
  revalidatePath("/principal/students"); return { success: true };
}

export async function suspendStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };
  await db.user.update({ where: { id: student.userId }, data: { isActive: false } });
  revalidatePath("/principal/students"); return { success: true };
}

export async function reinstateStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };
  await db.user.update({ where: { id: student.userId }, data: { isActive: true } });
  revalidatePath("/principal/students"); return { success: true };
}

// ============================================================
// SCHOOL SETTINGS
// ============================================================
export async function updateSchoolSettings(data: {
  name: string; motto?: string; primaryColor: string; secondaryColor: string; rulesText?: string; anthemLyrics?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };
  await db.school.update({ where: { id: principal.schoolId }, data: { name: data.name, motto: data.motto, primaryColor: data.primaryColor, secondaryColor: data.secondaryColor, rulesText: data.rulesText, anthemLyrics: data.anthemLyrics } });
  revalidatePath("/principal/settings"); return { success: true };
}

// ============================================================
// GRADE / SUBJECT / FEE MANAGEMENT
// ============================================================
export async function addGradeLevel(gradeLevel: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };
  const existing = await db.schoolGrade.findUnique({ where: { schoolId_gradeLevel: { schoolId: principal.schoolId, gradeLevel: gradeLevel as any } } });
  if (existing) return { error: "Already exists" };
  await db.schoolGrade.create({ data: { schoolId: principal.schoolId, gradeLevel: gradeLevel as any } });
  revalidatePath("/principal/curriculum"); return { success: true };
}

export async function removeGradeLevel(gradeId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.schoolGrade.delete({ where: { id: gradeId } });
  revalidatePath("/principal/curriculum"); return { success: true };
}

export async function addSubjectToGrade(schoolGradeId: string, subjectName: string, subjectCode: string, isRequired: boolean, weeklyPeriods: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  let subject = await db.subject.findUnique({ where: { code: subjectCode } });
  if (!subject) subject = await db.subject.create({ data: { name: subjectName, code: subjectCode } });
  const existing = await db.gradeSubject.findUnique({ where: { schoolGradeId_subjectId: { schoolGradeId, subjectId: subject.id } } });
  if (existing) return { error: "Already added" };
  await db.gradeSubject.create({ data: { schoolGradeId, subjectId: subject.id, isRequired, weeklyPeriods } });
  revalidatePath("/principal/curriculum"); return { success: true };
}

export async function removeSubjectFromGrade(gradeSubjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.gradeSubject.delete({ where: { id: gradeSubjectId } });
  revalidatePath("/principal/curriculum"); return { success: true };
}

export async function setFeeStructure(data: { schoolGradeId: string; term: string; tuitionFee: number; registrationFee: number; examFee: number; technologyFee: number; }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const principal = await db.principal.findUnique({ where: { userId: session.user.id }, include: { school: true } });
  if (!principal) return { error: "Principal not found" };
  await db.feeStructure.upsert({
    where: { schoolId_schoolGradeId_term: { schoolId: principal.schoolId, schoolGradeId: data.schoolGradeId, term: data.term as any } },
    update: { tuitionFee: data.tuitionFee, registrationFee: data.registrationFee, examFee: data.examFee, technologyFee: data.technologyFee },
    create: { schoolId: principal.schoolId, schoolGradeId: data.schoolGradeId, term: data.term as any, tuitionFee: data.tuitionFee, registrationFee: data.registrationFee, examFee: data.examFee, technologyFee: data.technologyFee, currency: principal.school.currency },
  });
  revalidatePath("/principal/fees"); return { success: true };
}
