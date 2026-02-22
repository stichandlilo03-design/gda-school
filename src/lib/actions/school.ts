"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// SCHOOL SETTINGS
// ============================================================
export async function updateSchoolSettings(data: {
  name: string;
  motto?: string;
  primaryColor: string;
  secondaryColor: string;
  rulesText?: string;
  anthemLyrics?: string;
  nationalAnthem?: string;
  sessionDurationMin?: number;
  breakDurationMin?: number;
  sessionsPerDay?: number;
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
      sessionDurationMin: data.sessionDurationMin || 40,
      breakDurationMin: data.breakDurationMin || 10,
      sessionsPerDay: data.sessionsPerDay || 4,
      rulesText: data.rulesText || null,
      anthemLyrics: data.anthemLyrics || null,
      nationalAnthem: data.nationalAnthem || null,
    },
  });

  revalidatePath("/principal/settings");
  revalidatePath("/principal");
  revalidatePath("/teacher/school-info");
  revalidatePath("/student/school-info");
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
// TEACHER MANAGEMENT
// ============================================================
export async function addTeacherToSchool(teacherEmail: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const user = await db.user.findUnique({
    where: { email: teacherEmail.toLowerCase() },
    include: { teacher: true },
  });

  if (!user || !user.teacher) return { error: "Teacher not found. They must register first." };

  const existing = await db.schoolTeacher.findUnique({
    where: { teacherId_schoolId: { teacherId: user.teacher.id, schoolId: principal.schoolId } },
  });
  if (existing) return { error: "Teacher already in your school" };

  await db.schoolTeacher.create({
    data: { teacherId: user.teacher.id, schoolId: principal.schoolId },
  });

  revalidatePath("/principal/teachers");
  return { success: true };
}

export async function removeTeacherFromSchool(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { isActive: false } });
  revalidatePath("/principal/teachers");
  return { success: true };
}

export async function reinstateTeacher(schoolTeacherId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const st = await db.schoolTeacher.update({ where: { id: schoolTeacherId }, data: { isActive: true, status: "APPROVED" }, include: { teacher: true, school: true } });
  // Send notification
  try {
    const { notify } = await import("@/lib/notifications");
    await notify(st.teacher.userId, "🎉 Reinstated!", `You have been reinstated at ${st.school.name}. Welcome back!`);
  } catch (_e) {}
  revalidatePath("/principal/teachers");
  return { success: true };
}

// ============================================================
// STUDENT MANAGEMENT
// ============================================================
export async function suspendStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.user.update({
    where: { id: (await db.student.findUnique({ where: { id: studentId } }))!.userId },
    data: { isActive: false },
  });

  revalidatePath("/principal/students");
  return { success: true };
}

export async function reinstateStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.user.update({
    where: { id: (await db.student.findUnique({ where: { id: studentId } }))!.userId },
    data: { isActive: true },
  });

  revalidatePath("/principal/students");
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

export async function updateFeePolicy(data: {
  feePaymentPolicy: string;
  feePaymentThreshold: number;
  feeInstructions: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  await db.school.update({
    where: { id: principal.schoolId },
    data: {
      feePaymentPolicy: data.feePaymentPolicy,
      feePaymentThreshold: Math.max(0, Math.min(100, data.feePaymentThreshold)),
      feeInstructions: data.feeInstructions || null,
    },
  });

  revalidatePath("/principal/fees");
  revalidatePath("/student");
  return { success: true };
}

// ==========================================
// SUSPEND/UNSUSPEND STUDENT FOR FEE DEFAULT
// ==========================================

export async function suspendStudentForFees(studentId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const student = await db.student.findUnique({ where: { id: studentId }, select: { id: true, schoolId: true, userId: true } });
  if (!student || student.schoolId !== principal.schoolId) return { error: "Student not found" };

  await db.student.update({
    where: { id: studentId },
    data: {
      isSuspended: true,
      suspendedAt: new Date(),
      suspendReason: reason || "Access suspended due to outstanding fee balance. Please pay your fees to continue.",
    },
  });

  // Notify student
  try {
    const { notify } = await import("@/lib/notifications");
    await notify(student.userId, "⚠️ Access Suspended", reason || "Your school portal access has been suspended due to outstanding fees. Please make a payment to restore access.");
  } catch (_e) {}

  revalidatePath("/principal/students");
  revalidatePath("/student");
  return { success: true };
}

export async function unsuspendStudent(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const student = await db.student.findUnique({ where: { id: studentId }, select: { id: true, schoolId: true, userId: true } });
  if (!student || student.schoolId !== principal.schoolId) return { error: "Student not found" };

  await db.student.update({
    where: { id: studentId },
    data: {
      isSuspended: false,
      suspendedAt: null,
      suspendReason: null,
    },
  });

  // Notify student
  try {
    const { notify } = await import("@/lib/notifications");
    await notify(student.userId, "✅ Access Restored", "Your school portal access has been restored. You can now access all features.");
  } catch (_e) {}

  revalidatePath("/principal/students");
  revalidatePath("/student");
  return { success: true };
}

// Auto-detect term end and suspend students with unpaid fees for new term
export async function checkTermFeeDefaults() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id }, select: { schoolId: true } });
  if (!principal) return { error: "Principal not found" };

  const school = await db.school.findUnique({
    where: { id: principal.schoolId },
    select: { id: true, feePaymentPolicy: true, feePaymentThreshold: true },
  });
  if (!school) return { error: "School not found" };

  const activeTerm = await db.term.findFirst({
    where: { schoolId: principal.schoolId, isActive: true },
    select: { termNumber: true, name: true },
  });
  if (!activeTerm) return { error: "No active term" };

  // Get all approved, non-suspended students
  const students = await db.student.findMany({
    where: { schoolId: principal.schoolId, approvalStatus: "APPROVED", isSuspended: false },
    select: {
      id: true, userId: true, gradeLevel: true, feePaid: true,
      payments: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  });

  let suspendedCount = 0;
  for (const st of students) {
    if (st.feePaid) continue;
    
    const paidTotal = st.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
    const sg = await db.schoolGrade.findFirst({
      where: { schoolId: principal.schoolId, gradeLevel: st.gradeLevel },
      select: { id: true },
    });
    if (!sg) continue;

    // Get ALL fees up to current term
    const termOrder = ["TERM_1", "TERM_2", "TERM_3"];
    const currentIdx = termOrder.indexOf(activeTerm.termNumber);
    const termsToCheck = termOrder.slice(0, currentIdx + 1);

    const fees = await db.feeStructure.findMany({
      where: { schoolGradeId: sg.id, isActive: true, term: { in: termsToCheck as any } },
      select: { tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
    });
    const totalDue = fees.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
    if (totalDue === 0) continue;

    const pct = Math.round((paidTotal / totalDue) * 100);
    const threshold = school.feePaymentThreshold ?? 70;
    const policy = school.feePaymentPolicy || "PERCENTAGE";

    let meetsReq = false;
    if (policy === "FLEXIBLE") meetsReq = true;
    else if (policy === "FULL") meetsReq = pct >= 100;
    else meetsReq = pct >= threshold;

    if (!meetsReq) {
      await db.student.update({
        where: { id: st.id },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendReason: `Access suspended: ${activeTerm.name} fees not met (${pct}% paid, ${threshold}% required). Please pay to continue.`,
        },
      });
      try {
        const { notify } = await import("@/lib/notifications");
        await notify(st.userId, "⚠️ Access Suspended — Fees Due",
          `Your access has been suspended for ${activeTerm.name}. You've paid ${pct}% but ${threshold}% is required. Please make a payment to restore access.`);
      } catch (_e) {}
      suspendedCount++;
    }
  }

  revalidatePath("/principal/students");
  return { success: true, suspendedCount };
}
