"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Student submits payment with proof
export async function submitPaymentProof(data: {
  amount: number; currency: string; paymentMethod: string;
  transactionRef?: string; proofBase64?: string; proofNote?: string;
  description: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return { error: "Student not found" };

  let proofUrl = null;
  if (data.proofBase64) {
    const match = data.proofBase64.match(/^data:(image\/\w+|application\/pdf);base64,(.+)$/);
    if (match) {
      const ext = match[1].includes("pdf") ? "pdf" : match[1].split("/")[1];
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > 10 * 1024 * 1024) return { error: "File too large (max 10MB)" };
      const dir = path.join(process.cwd(), "public", "uploads", "payments");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `${student.id}-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(dir, filename), buffer);
      proofUrl = `/uploads/payments/${filename}`;
    }
  }

  await db.payment.create({
    data: {
      studentId: student.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef || null,
      proofUrl,
      proofNote: data.proofNote || null,
      status: "UNDER_REVIEW",
      paidAt: new Date(),
    },
  });

  revalidatePath("/student/fees");
  revalidatePath("/principal/payments");
  return { success: true };
}

// Principal approves payment
export async function approvePayment(paymentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { student: true } });
  if (!payment) return { error: "Payment not found" };

  await db.payment.update({
    where: { id: paymentId },
    data: { status: "COMPLETED", reviewedBy: session.user.id, reviewedAt: new Date() },
  });

  // Check if total paid covers total fees - if so, mark feePaid
  const student = payment.student;
  const schoolGrade = await db.schoolGrade.findFirst({
    where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
  });
  if (schoolGrade) {
    const feeStructure = await db.feeStructure.findFirst({
      where: { schoolGradeId: schoolGrade.id, isActive: true },
    });
    if (feeStructure) {
      const totalFees = feeStructure.tuitionFee + feeStructure.registrationFee + feeStructure.examFee + feeStructure.technologyFee;
      const totalPaid = await db.payment.aggregate({
        where: { studentId: student.id, status: "COMPLETED" },
        _sum: { amount: true },
      });
      if ((totalPaid._sum.amount || 0) >= totalFees) {
        await db.student.update({ where: { id: student.id }, data: { feePaid: true } });
      }
    }
  }

  revalidatePath("/principal/payments");
  revalidatePath("/student/fees");
  return { success: true };
}

// Principal rejects payment
export async function rejectPayment(paymentId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.payment.update({
    where: { id: paymentId },
    data: { status: "REJECTED", rejectedReason: reason, reviewedBy: session.user.id, reviewedAt: new Date() },
  });

  revalidatePath("/principal/payments");
  revalidatePath("/student/fees");
  return { success: true };
}
