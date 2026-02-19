"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// PRINCIPAL: Set/Update teacher salary
// ============================================================
export async function setTeacherSalary(data: {
  schoolTeacherId: string;
  baseSalary: number;
  currency: string;
  payFrequency: string;
  workingDaysPerMonth: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  taxRate: number;
  pensionRate: number;
  otherDeductions: number;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const existing = await db.teacherSalary.findUnique({ where: { schoolTeacherId: data.schoolTeacherId } });

  if (existing) {
    await db.salaryHistory.create({
      data: {
        teacherSalaryId: existing.id,
        previousAmount: existing.baseSalary,
        newAmount: data.baseSalary,
        reason: data.notes || "Salary updated",
        changedBy: session.user.name,
      },
    });
    await db.teacherSalary.update({
      where: { schoolTeacherId: data.schoolTeacherId },
      data: {
        baseSalary: data.baseSalary, currency: data.currency, payFrequency: data.payFrequency,
        workingDaysPerMonth: data.workingDaysPerMonth,
        housingAllowance: data.housingAllowance, transportAllowance: data.transportAllowance,
        otherAllowances: data.otherAllowances, taxRate: data.taxRate,
        pensionRate: data.pensionRate, otherDeductions: data.otherDeductions, notes: data.notes,
      },
    });
  } else {
    await db.teacherSalary.create({
      data: {
        schoolTeacherId: data.schoolTeacherId,
        baseSalary: data.baseSalary, currency: data.currency, payFrequency: data.payFrequency,
        workingDaysPerMonth: data.workingDaysPerMonth,
        housingAllowance: data.housingAllowance, transportAllowance: data.transportAllowance,
        otherAllowances: data.otherAllowances, taxRate: data.taxRate,
        pensionRate: data.pensionRate, otherDeductions: data.otherDeductions, notes: data.notes,
      },
    });
  }

  revalidatePath("/principal/payroll");
  revalidatePath("/teacher/payroll");
  return { success: true };
}

// ============================================================
// TEACHER: Log a teaching session (earns daily rate)
// ============================================================
export async function logTeachingSession(data: {
  classId: string;
  date: string;
  hoursWorked?: number;
  topic?: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      schools: {
        where: { status: "APPROVED", isActive: true },
        include: { salary: true },
      },
    },
  });
  if (!teacher) return { error: "Teacher not found" };

  const schoolTeacher = teacher.schools[0];
  if (!schoolTeacher || !schoolTeacher.salary) return { error: "No salary configured. Ask your principal." };

  const salary = schoolTeacher.salary;
  const grossMonthly = salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances;
  const dailyRate = grossMonthly / salary.workingDaysPerMonth;
  const hours = data.hoursWorked || 1;
  // Pro-rate if less than full day (assuming 8 hour day)
  const amountEarned = hours >= 8 ? dailyRate : dailyRate * (hours / 8);

  // Check if session already logged for this class+date
  const dateObj = new Date(data.date);
  const existing = await db.teachingSession.findUnique({
    where: {
      schoolTeacherId_classId_date: {
        schoolTeacherId: schoolTeacher.id,
        classId: data.classId,
        date: dateObj,
      },
    },
  });
  if (existing) return { error: "Session already logged for this class on this date." };

  await db.teachingSession.create({
    data: {
      schoolTeacherId: schoolTeacher.id,
      classId: data.classId,
      date: dateObj,
      hoursWorked: hours,
      dailyRate,
      amountEarned: Math.round(amountEarned * 100) / 100,
      currency: salary.currency,
      topic: data.topic,
      notes: data.notes,
    },
  });

  revalidatePath("/teacher/payroll");
  revalidatePath("/teacher");
  return { success: true, earned: Math.round(amountEarned * 100) / 100, dailyRate: Math.round(dailyRate * 100) / 100 };
}

// ============================================================
// AUTO-LOG: Called when teacher marks attendance (integration)
// ============================================================
export async function autoLogSessionFromAttendance(teacherUserId: string, classId: string) {
  const teacher = await db.teacher.findUnique({
    where: { userId: teacherUserId },
    include: {
      schools: { where: { status: "APPROVED", isActive: true }, include: { salary: true } },
    },
  });
  if (!teacher) return;
  const schoolTeacher = teacher.schools[0];
  if (!schoolTeacher?.salary) return;

  const salary = schoolTeacher.salary;
  const grossMonthly = salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances;
  const dailyRate = grossMonthly / salary.workingDaysPerMonth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.teachingSession.findUnique({
    where: { schoolTeacherId_classId_date: { schoolTeacherId: schoolTeacher.id, classId, date: today } },
  });
  if (existing) return; // Already logged today

  await db.teachingSession.create({
    data: {
      schoolTeacherId: schoolTeacher.id, classId, date: today,
      hoursWorked: 1, dailyRate, amountEarned: dailyRate, currency: salary.currency,
      topic: "Auto-logged from attendance",
    },
  });
}

// ============================================================
// PRINCIPAL: Verify teaching session
// ============================================================
export async function verifySession(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.teachingSession.update({
    where: { id: sessionId },
    data: { verified: true, verifiedBy: session.user.name },
  });

  revalidatePath("/principal/payroll");
  return { success: true };
}

export async function bulkVerifySessions(sessionIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.teachingSession.updateMany({
    where: { id: { in: sessionIds } },
    data: { verified: true, verifiedBy: session.user.name },
  });

  revalidatePath("/principal/payroll");
  return { success: true };
}

export async function rejectSession(sessionId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.teachingSession.update({
    where: { id: sessionId },
    data: { notes: `REJECTED: ${reason}`, amountEarned: 0 },
  });

  revalidatePath("/principal/payroll");
  return { success: true };
}

// ============================================================
// PRINCIPAL: Generate payroll from earned sessions
// ============================================================
export async function generatePayroll(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const teachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId, status: "APPROVED", isActive: true },
    include: {
      salary: true,
      sessions: {
        where: {
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      },
    },
  });

  let created = 0;
  for (const st of teachers) {
    if (!st.salary) continue;
    const existing = await db.payrollRecord.findUnique({
      where: { schoolTeacherId_month_year: { schoolTeacherId: st.id, month, year } },
    });
    if (existing) continue;

    // Calculate from actual sessions
    const totalEarned = st.sessions.reduce((s, sess) => s + sess.amountEarned, 0);
    const daysWorked = st.sessions.length;
    const grossMonthly = st.salary.baseSalary + st.salary.housingAllowance + st.salary.transportAllowance + st.salary.otherAllowances;

    // Earned amount is capped at full monthly salary
    const earnedGross = Math.min(totalEarned, grossMonthly);
    const taxDeduction = earnedGross * (st.salary.taxRate / 100);
    const pensionDeduction = earnedGross * (st.salary.pensionRate / 100);
    const netPay = earnedGross - taxDeduction - pensionDeduction - st.salary.otherDeductions;

    await db.payrollRecord.create({
      data: {
        schoolTeacherId: st.id, month, year,
        baseSalary: st.salary.baseSalary,
        allowances: st.salary.housingAllowance + st.salary.transportAllowance + st.salary.otherAllowances,
        grossPay: earnedGross,
        taxDeduction, pensionDeduction,
        otherDeductions: st.salary.otherDeductions,
        netPay: Math.max(0, Math.round(netPay * 100) / 100),
        currency: st.salary.currency,
        status: "DRAFT",
        notes: `${daysWorked} days worked of ${st.salary.workingDaysPerMonth}. Earned: ${Math.round(totalEarned)}`,
      },
    });
    created++;
  }

  revalidatePath("/principal/payroll");
  return { success: true, message: `Generated payroll for ${created} teacher(s).` };
}

// ============================================================
// PRINCIPAL: Process payments
// ============================================================
export async function processPayroll(payrollId: string, transactionRef?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.payrollRecord.update({
    where: { id: payrollId },
    data: { status: "PAID", paidAt: new Date(), transactionRef: transactionRef || null },
  });
  revalidatePath("/principal/payroll");
  return { success: true };
}

export async function batchProcessPayroll(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const records = await db.payrollRecord.findMany({
    where: { month, year, status: "DRAFT", schoolTeacher: { schoolId: principal.schoolId } },
  });
  for (const r of records) {
    await db.payrollRecord.update({ where: { id: r.id }, data: { status: "PAID", paidAt: new Date() } });
  }
  revalidatePath("/principal/payroll");
  return { success: true, message: `Paid ${records.length} teacher(s).` };
}

export async function cancelPayroll(payrollId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.payrollRecord.update({ where: { id: payrollId }, data: { status: "CANCELLED" } });
  revalidatePath("/principal/payroll");
  return { success: true };
}

export async function adjustPayroll(payrollId: string, adjustment: number, notes: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const record = await db.payrollRecord.findUnique({ where: { id: payrollId } });
  if (!record) return { error: "Not found" };

  await db.payrollRecord.update({
    where: { id: payrollId },
    data: {
      otherDeductions: adjustment < 0 ? record.otherDeductions + Math.abs(adjustment) : record.otherDeductions,
      allowances: adjustment > 0 ? record.allowances + adjustment : record.allowances,
      netPay: Math.max(0, record.netPay + adjustment),
      notes: record.notes ? `${record.notes}\n${notes}` : notes,
    },
  });
  revalidatePath("/principal/payroll");
  return { success: true };
}

// ============================================================
// TEACHER: Bank account management
// ============================================================
export async function addBankAccount(data: {
  methodType: string;
  label: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  branchCode?: string;
  mobileProvider?: string;
  mobileNumber?: string;
  paypalEmail?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  countryCode: string;
  currency: string;
  isPrimary: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  if (data.isPrimary) {
    await db.teacherBankAccount.updateMany({ where: { teacherId: teacher.id }, data: { isPrimary: false } });
  }

  await db.teacherBankAccount.create({
    data: {
      teacherId: teacher.id,
      methodType: data.methodType as any,
      label: data.label,
      bankName: data.bankName, accountName: data.accountName, accountNumber: data.accountNumber,
      routingNumber: data.routingNumber, swiftCode: data.swiftCode,
      mobileProvider: data.mobileProvider, mobileNumber: data.mobileNumber,
      paypalEmail: data.paypalEmail,
      cryptoAddress: data.cryptoAddress, cryptoNetwork: data.cryptoNetwork,
      countryCode: data.countryCode, currency: data.currency, isPrimary: data.isPrimary,
    },
  });

  revalidatePath("/teacher/payroll");
  return { success: true };
}

export async function removeBankAccount(accountId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };
  await db.teacherBankAccount.delete({ where: { id: accountId } });
  revalidatePath("/teacher/payroll");
  return { success: true };
}

export async function setPrimaryAccount(accountId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };
  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };
  await db.teacherBankAccount.updateMany({ where: { teacherId: teacher.id }, data: { isPrimary: false } });
  await db.teacherBankAccount.update({ where: { id: accountId }, data: { isPrimary: true } });
  revalidatePath("/teacher/payroll");
  return { success: true };
}
