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
    // Log history
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
        baseSalary: data.baseSalary,
        currency: data.currency,
        payFrequency: data.payFrequency,
        housingAllowance: data.housingAllowance,
        transportAllowance: data.transportAllowance,
        otherAllowances: data.otherAllowances,
        taxRate: data.taxRate,
        pensionRate: data.pensionRate,
        otherDeductions: data.otherDeductions,
        notes: data.notes,
      },
    });
  } else {
    await db.teacherSalary.create({
      data: {
        schoolTeacherId: data.schoolTeacherId,
        baseSalary: data.baseSalary,
        currency: data.currency,
        payFrequency: data.payFrequency,
        housingAllowance: data.housingAllowance,
        transportAllowance: data.transportAllowance,
        otherAllowances: data.otherAllowances,
        taxRate: data.taxRate,
        pensionRate: data.pensionRate,
        otherDeductions: data.otherDeductions,
        notes: data.notes,
      },
    });
  }

  revalidatePath("/principal/payroll");
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/interviews");
  return { success: true };
}

// ============================================================
// PRINCIPAL: Generate monthly payroll
// ============================================================
export async function generatePayroll(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const teachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId, status: "APPROVED", isActive: true },
    include: { salary: true },
  });

  let created = 0;
  for (const st of teachers) {
    if (!st.salary) continue;

    const existing = await db.payrollRecord.findUnique({
      where: { schoolTeacherId_month_year: { schoolTeacherId: st.id, month, year } },
    });
    if (existing) continue;

    const allowances = st.salary.housingAllowance + st.salary.transportAllowance + st.salary.otherAllowances;
    const grossPay = st.salary.baseSalary + allowances;
    const taxDeduction = grossPay * (st.salary.taxRate / 100);
    const pensionDeduction = grossPay * (st.salary.pensionRate / 100);
    const netPay = grossPay - taxDeduction - pensionDeduction - st.salary.otherDeductions;

    await db.payrollRecord.create({
      data: {
        schoolTeacherId: st.id,
        month, year,
        baseSalary: st.salary.baseSalary,
        allowances,
        grossPay,
        taxDeduction,
        pensionDeduction,
        otherDeductions: st.salary.otherDeductions,
        netPay: Math.max(0, netPay),
        currency: st.salary.currency,
        status: "DRAFT",
      },
    });
    created++;
  }

  revalidatePath("/principal/payroll");
  return { success: true, message: `Generated payroll for ${created} teacher(s).` };
}

// ============================================================
// PRINCIPAL: Process payroll (mark as paid)
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

// Batch pay all draft payrolls for a month
export async function batchProcessPayroll(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Principal not found" };

  const records = await db.payrollRecord.findMany({
    where: {
      month, year, status: "DRAFT",
      schoolTeacher: { schoolId: principal.schoolId },
    },
  });

  for (const r of records) {
    await db.payrollRecord.update({
      where: { id: r.id },
      data: { status: "PAID", paidAt: new Date() },
    });
  }

  revalidatePath("/principal/payroll");
  return { success: true, message: `Paid ${records.length} teacher(s).` };
}

// Cancel a payroll
export async function cancelPayroll(payrollId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.payrollRecord.update({ where: { id: payrollId }, data: { status: "CANCELLED" } });
  revalidatePath("/principal/payroll");
  return { success: true };
}

// Adjust a payroll (bonus/deduction)
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
      netPay: record.netPay + adjustment,
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

  // If setting as primary, unset others
  if (data.isPrimary) {
    await db.teacherBankAccount.updateMany({ where: { teacherId: teacher.id }, data: { isPrimary: false } });
  }

  await db.teacherBankAccount.create({
    data: {
      teacherId: teacher.id,
      methodType: data.methodType as any,
      label: data.label,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      swiftCode: data.swiftCode,
      mobileProvider: data.mobileProvider,
      mobileNumber: data.mobileNumber,
      paypalEmail: data.paypalEmail,
      cryptoAddress: data.cryptoAddress,
      cryptoNetwork: data.cryptoNetwork,
      countryCode: data.countryCode,
      currency: data.currency,
      isPrimary: data.isPrimary,
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
