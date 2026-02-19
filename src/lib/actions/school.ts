"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// TEACHER APPROVAL / MANAGEMENT
// ============================================================

// Principal invites a teacher by email
export async function inviteTeacherToSchool(teacherEmail: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const user = await db.user.findUnique({
    where: { email: teacherEmail.toLowerCase() },
    include: { teacher: true },
  });

  if (!user || !user.teacher) return { error: "Teacher not found. They must register as a teacher first." };

  const existing = await db.schoolTeacher.findUnique({
    where: { teacherId_schoolId: { teacherId: user.teacher.id, schoolId: principal.schoolId } },
  });

  if (existing) {
    if (existing.status === "APPROVED" && existing.isActive) return { error: "Teacher is already in your school." };
    if (existing.status === "PENDING") return { error: "Teacher already has a pending request." };
    // Reinstate or re-invite
    await db.schoolTeacher.update({
      where: { id: existing.id },
      data: { status: "APPROVED", isActive: true, requestedBy: "PRINCIPAL" },
    });
    revalidatePath("/principal/teachers");
    return { success: true, message: "Teacher re-added to your school." };
  }

  await db.schoolTeacher.create({
    data: {
      teacherId: user.teacher.id,
      schoolId: principal.schoolId,
      status: "APPROVED",
      isActive: true,
      requestedBy: "PRINCIPAL",
    },
  });

  revalidatePath("/principal/teachers");
  return { success: true, message: "Teacher invited and added to your school!" };
}

// Approve a teacher's request
export async function approveTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({
    where: { id: schoolTeacherId },
    data: { status: "APPROVED", isActive: true },
  });

  revalidatePath("/principal/teachers");
  revalidatePath("/principal");
  return { success: true };
}

// Reject a teacher's request
export async function rejectTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({
    where: { id: schoolTeacherId },
    data: { status: "REJECTED", isActive: false },
  });

  revalidatePath("/principal/teachers");
  revalidatePath("/principal");
  return { success: true };
}

// Remove an active teacher
export async function removeTeacherFromSchool(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { isActive: false } });
  revalidatePath("/principal/teachers");
  return { success: true };
}

// Reinstate a removed teacher
export async function reinstateTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { isActive: true, status: "APPROVED" } });
  revalidatePath("/principal/teachers");
  return { success: true };
}

// ============================================================
// STUDENT APPROVAL / MANAGEMENT
// ============================================================

// Approve a student application
export async function approveStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.student.update({
    where: { id: studentId },
    data: { approvalStatus: "APPROVED" },
  });

  revalidatePath("/principal/students");
  revalidatePath("/principal");
  return { success: true };
}

// Reject a student application
export async function rejectStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.student.update({
    where: { id: studentId },
    data: { approvalStatus: "REJECTED" },
  });

  revalidatePath("/principal/students");
  revalidatePath("/principal");
  return { success: true };
}

// Suspend an approved student
export async function suspendStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  await db.user.update({
    where: { id: student.userId },
    data: { isActive: false },
  });

  revalidatePath("/principal/students");
  return { success: true };
}

// Reinstate a suspended student
export async function reinstateStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found" };

  await db.user.update({
    where: { id: student.userId },
    data: { isActive: true },
  });

  revalidatePath("/principal/students");
  return { success: true };
}

// ============================================================
// SCHOOL SETTINGS (unchanged)
// ============================================================
export async function updateSchoolSettings(data: {
  name: string;
  motto?: string;
  primaryColor: string;
  secondaryColor: string;
  rulesText?: string;
  anthemLyrics?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  await db.school.update({
    where: { id: principal.schoolId },
    data: {
      name: data.name,
      motto: data.motto || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      rulesText: data.rulesText || null,
      anthemLyrics: data.anthemLyrics || null,
    },
  });

  revalidatePath("/principal/settings");
  revalidatePath("/principal");
  return { success: true };
}

// ============================================================
// GRADE MANAGEMENT
// ============================================================
export async function addGradeLevel(gradeLevel: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const existing = await db.schoolGrade.findUnique({
    where: { schoolId_gradeLevel: { schoolId: principal.schoolId, gradeLevel: gradeLevel as any } },
  });
  if (existing) return { error: "Grade level already exists" };

  await db.schoolGrade.create({
    data: { schoolId: principal.schoolId, gradeLevel: gradeLevel as any },
  });

  revalidatePath("/principal/curriculum");
  return { success: true };
}

export async function removeGradeLevel(gradeId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolGrade.delete({ where: { id: gradeId } });
  revalidatePath("/principal/curriculum");
  return { success: true };
}

// ============================================================
// SUBJECT MANAGEMENT
// ============================================================
export async function addSubjectToGrade(schoolGradeId: string, subjectName: string, subjectCode: string, isRequired: boolean, weeklyPeriods: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  let subject = await db.subject.findUnique({ where: { code: subjectCode } });
  if (!subject) {
    subject = await db.subject.create({ data: { name: subjectName, code: subjectCode } });
  }

  const existing = await db.gradeSubject.findUnique({
    where: { schoolGradeId_subjectId: { schoolGradeId, subjectId: subject.id } },
  });
  if (existing) return { error: "Subject already added to this grade" };

  await db.gradeSubject.create({
    data: { schoolGradeId, subjectId: subject.id, isRequired, weeklyPeriods },
  });

  revalidatePath("/principal/curriculum");
  return { success: true };
}

export async function removeSubjectFromGrade(gradeSubjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.gradeSubject.delete({ where: { id: gradeSubjectId } });
  revalidatePath("/principal/curriculum");
  return { success: true };
}

// ============================================================
// FEE MANAGEMENT
// ============================================================
export async function setFeeStructure(data: {
  schoolGradeId: string;
  term: string;
  tuitionFee: number;
  registrationFee: number;
  examFee: number;
  technologyFee: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });
  if (!principal) return { error: "Principal not found" };

  await db.feeStructure.upsert({
    where: {
      schoolId_schoolGradeId_term: {
        schoolId: principal.schoolId,
        schoolGradeId: data.schoolGradeId,
        term: data.term as any,
      },
    },
    update: {
      tuitionFee: data.tuitionFee,
      registrationFee: data.registrationFee,
      examFee: data.examFee,
      technologyFee: data.technologyFee,
    },
    create: {
      schoolId: principal.schoolId,
      schoolGradeId: data.schoolGradeId,
      term: data.term as any,
      tuitionFee: data.tuitionFee,
      registrationFee: data.registrationFee,
      examFee: data.examFee,
      technologyFee: data.technologyFee,
      currency: principal.school.currency,
    },
  });

  revalidatePath("/principal/fees");
  return { success: true };
}
