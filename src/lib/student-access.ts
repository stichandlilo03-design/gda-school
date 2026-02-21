import { db } from "@/lib/db";

export type StudentAccessStatus = {
  hasFullAccess: boolean;
  isApproved: boolean;
  approvalStatus: string;
  feesMet: boolean;
  feePercent: number;
  totalFees: number;
  paidAmount: number;
  feePolicy: string;
  feeThreshold: number;
  reasons: string[];
};

export async function checkStudentAccess(userId: string): Promise<StudentAccessStatus | null> {
  try {
    const student = await db.student.findUnique({
      where: { userId },
      include: {
        school: true,
        payments: true,
      },
    });

    if (!student) return null;

    const isApproved = student.approvalStatus === "APPROVED";
    const reasons: string[] = [];

    // Filter completed payments in JS
    const completedPayments = student.payments.filter((p: any) => p.status === "COMPLETED");
    const paidAmount = completedPayments.reduce((s: number, p: any) => s + p.amount, 0);

    let totalFees = 0;
    try {
      const schoolGrade = await db.schoolGrade.findFirst({
        where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
      });
      if (schoolGrade) {
        const feeStructures = await db.feeStructure.findMany({
          where: { schoolGradeId: schoolGrade.id, isActive: true },
        });
        totalFees = feeStructures.reduce((s, f) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
      }
    } catch (_e) {
      // Fee calculation failed, skip
    }

    const feePercent = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 100;
    const feeThreshold = student.school.feePaymentThreshold ?? 70;
    const feePolicy = student.school.feePaymentPolicy || "PERCENTAGE";

    let feesMet = student.feePaid;
    if (!feesMet) {
      if (feePolicy === "FLEXIBLE") feesMet = true;
      else if (feePolicy === "FULL") feesMet = feePercent >= 100;
      else feesMet = feePercent >= feeThreshold;
    }
    if (totalFees === 0) feesMet = true;

    if (!isApproved) {
      if (student.approvalStatus === "PENDING") reasons.push("Your admission is pending principal approval.");
      else if (student.approvalStatus === "INTERVIEW_SCHEDULED") reasons.push("You have an interview scheduled. Please attend it.");
      else if (student.approvalStatus === "INTERVIEWED") reasons.push("Your interview is complete. Awaiting principal decision.");
      else if (student.approvalStatus === "REJECTED") reasons.push("Your admission was not approved. Contact the school for details.");
      else reasons.push("Your admission needs principal approval.");
    }
    if (!feesMet && totalFees > 0) {
      if (feePolicy === "FULL") reasons.push("Full fee payment required. You have paid " + feePercent + "% so far.");
      else reasons.push("You need to pay at least " + feeThreshold + "% of fees. Currently at " + feePercent + "%.");
    }

    return {
      hasFullAccess: isApproved && feesMet,
      isApproved,
      approvalStatus: student.approvalStatus,
      feesMet,
      feePercent,
      totalFees,
      paidAmount,
      feePolicy,
      feeThreshold,
      reasons,
    };
  } catch (e) {
    console.error("checkStudentAccess error:", e);
    return null;
  }
}
