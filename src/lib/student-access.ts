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
  debug?: string;
};

export async function checkStudentAccess(userId: string): Promise<StudentAccessStatus | null> {
  try {
    const student = await db.student.findUnique({
      where: { userId },
      select: {
        id: true,
        approvalStatus: true,
        feePaid: true,
        schoolId: true,
        gradeLevel: true,
        school: {
          select: { feePaymentThreshold: true, feePaymentPolicy: true },
        },
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    });
    if (!student) return null;

    const isApproved = student.approvalStatus === "APPROVED";
    const feeThreshold = student.school.feePaymentThreshold ?? 70;
    const feePolicy = student.school.feePaymentPolicy || "PERCENTAGE";
    const paidAmount = student.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);

    // Get total fees - try current term first, then all terms
    let totalFees = 0;
    let debugInfo = "";
    try {
      const sg = await db.schoolGrade.findFirst({
        where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
        select: { id: true },
      });
      if (sg) {
        // Try to get current active term fees first
        const activeTerm = await db.term.findFirst({
          where: { schoolId: student.schoolId, isActive: true },
          select: { termNumber: true },
        });
        
        let fees;
        if (activeTerm) {
          // Get ONLY current term fees
          fees = await db.feeStructure.findMany({
            where: { schoolGradeId: sg.id, isActive: true, term: activeTerm.termNumber },
            select: { tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
          });
          debugInfo = `term:${activeTerm.termNumber}`;
        }
        
        // If no term-specific fees found, get all active fees
        if (!fees || fees.length === 0) {
          fees = await db.feeStructure.findMany({
            where: { schoolGradeId: sg.id, isActive: true },
            select: { tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
          });
          debugInfo = `all-terms(${fees.length})`;
        }
        
        totalFees = fees.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
      } else {
        debugInfo = "no-schoolgrade";
      }
    } catch (_e2) {
      debugInfo = "fee-calc-error";
    }

    const feePercent = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 100;

    // Determine if fees are met based on policy
    let feesMet = false;
    
    // If already marked as fully paid, always grant access
    if (student.feePaid) {
      feesMet = true;
    }
    // Check policy-based access
    else if (feePolicy === "FLEXIBLE") {
      feesMet = true;
    }
    else if (feePolicy === "FULL") {
      feesMet = feePercent >= 100;
    }
    else {
      // PERCENTAGE policy - the main one
      feesMet = feePercent >= feeThreshold;
    }
    
    // No fees set up = no fee requirement
    if (totalFees === 0) feesMet = true;

    const reasons: string[] = [];
    if (!isApproved) {
      const labels: Record<string, string> = {
        PENDING: "Your admission is pending principal approval.",
        INTERVIEW_SCHEDULED: "You have an interview scheduled.",
        INTERVIEWED: "Interview complete. Awaiting decision.",
        REJECTED: "Admission not approved. Contact the school.",
      };
      reasons.push(labels[student.approvalStatus] || "Admission needs approval.");
    }
    if (!feesMet && totalFees > 0) {
      reasons.push(feePolicy === "FULL"
        ? "Full payment required (" + feePercent + "% paid)."
        : "Pay at least " + feeThreshold + "% (" + feePercent + "% paid).");
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
      debug: debugInfo,
    };
  } catch (_e) {
    // CRITICAL: If the function fails, return a safe default that still shows debug info
    // instead of null which locks the student out entirely
    return {
      hasFullAccess: false,
      isApproved: false,
      approvalStatus: "UNKNOWN",
      feesMet: false,
      feePercent: 0,
      totalFees: 0,
      paidAmount: 0,
      feePolicy: "UNKNOWN",
      feeThreshold: 0,
      reasons: ["Could not verify enrollment status. Please contact school."],
      debug: "error:" + (_e instanceof Error ? _e.message : "unknown"),
    };
  }
}
