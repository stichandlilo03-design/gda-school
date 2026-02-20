"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Student submits payment with proof (base64 stored in DB - no filesystem)
export async function submitPaymentProof(data: {
  amount: number; currency: string; paymentMethod: string;
  transactionRef?: string; proofBase64?: string; proofNote?: string;
  description: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") return { error: "Unauthorized" };

    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return { error: "Student not found" };

    if (data.proofBase64 && data.proofBase64.length > 10 * 1024 * 1024) {
      return { error: "File too large (max 5MB)" };
    }

    await db.payment.create({
      data: {
        studentId: student.id,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || null,
        proofUrl: data.proofBase64 || null,
        proofNote: data.proofNote || null,
        status: "UNDER_REVIEW",
        paidAt: new Date(),
      },
    });

    revalidatePath("/student/fees");
    revalidatePath("/principal/payments");
    return { success: true };
  } catch (err: any) {
    console.error("submitPaymentProof error:", err);
    return { error: err.message || "Failed to submit payment" };
  }
}

// Student edits their own pending payment (before principal reviews)
export async function editStudentPayment(paymentId: string, data: {
  amount: number; paymentMethod: string; transactionRef?: string;
  proofBase64?: string; proofNote?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") return { error: "Unauthorized" };

    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return { error: "Student not found" };

    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { error: "Payment not found" };
    if (payment.studentId !== student.id) return { error: "Not your payment" };
    if (payment.status !== "UNDER_REVIEW") return { error: "Already processed" };

    const updateData: any = {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef || null,
      proofNote: data.proofNote || null,
    };
    if (data.proofBase64) {
      if (data.proofBase64.length > 10 * 1024 * 1024) return { error: "File too large" };
      updateData.proofUrl = data.proofBase64;
    }

    await db.payment.update({ where: { id: paymentId }, data: updateData });
    revalidatePath("/student/fees");
    revalidatePath("/principal/payments");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update" };
  }
}

// Principal edits payment details before approving
export async function principalEditPayment(paymentId: string, data: {
  amount: number; paymentMethod: string; transactionRef?: string; proofNote?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

    await db.payment.update({
      where: { id: paymentId },
      data: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || null,
        proofNote: data.proofNote || null,
      },
    });

    revalidatePath("/principal/payments");
    revalidatePath("/student/fees");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update" };
  }
}

// Principal approves payment
export async function approvePayment(paymentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

    const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { student: true } });
    if (!payment) return { error: "Payment not found" };

    await db.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", reviewedBy: session.user.id, reviewedAt: new Date() },
    });

    // Check if total paid covers total fees
    const student = payment.student;
    const schoolGrade = await db.schoolGrade.findFirst({
      where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
    });
    if (schoolGrade) {
      const feeStructures = await db.feeStructure.findMany({
        where: { schoolGradeId: schoolGrade.id, isActive: true },
      });
      if (feeStructures.length > 0) {
        const totalFees = feeStructures.reduce((sum, fs) =>
          sum + fs.tuitionFee + fs.registrationFee + fs.examFee + fs.technologyFee, 0);
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
  } catch (err: any) {
    return { error: err.message || "Failed to approve" };
  }
}

// Principal rejects payment
export async function rejectPayment(paymentId: string, reason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

    await db.payment.update({
      where: { id: paymentId },
      data: { status: "REJECTED", rejectedReason: reason, reviewedBy: session.user.id, reviewedAt: new Date() },
    });

    revalidatePath("/principal/payments");
    revalidatePath("/student/fees");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to reject" };
  }
}
