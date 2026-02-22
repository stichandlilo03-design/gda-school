import { db } from "@/lib/db";

export type StudentAccessStatus = {
  hasFullAccess: boolean;
  isApproved: boolean;
  approvalStatus: string;
  isSuspended: boolean;
  suspendReason: string;
  feesMet: boolean;
  feePercent: number;
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  balanceDue: number;
  feePolicy: string;
  feeThreshold: number;
  currentTermName: string;
  currentTermNumber: string;
  termBreakdown: { term: string; label: string; isCurrent: boolean; total: number; paid: number; owed: number }[];
  reasons: string[];
  debug: string;
};

export async function checkStudentAccess(userId: string): Promise<StudentAccessStatus | null> {
  try {
    const student = await db.student.findUnique({
      where: { userId },
      select: {
        id: true,
        approvalStatus: true,
        feePaid: true,
        isSuspended: true,
        suspendReason: true,
        schoolId: true,
        gradeLevel: true,
        school: {
          select: { feePaymentThreshold: true, feePaymentPolicy: true },
        },
        payments: {
          select: { amount: true, status: true },
        },
      },
    });
    if (!student) return null;

    const isApproved = student.approvalStatus === "APPROVED";
    const isSuspended = student.isSuspended === true;
    const suspendReason = (student.suspendReason as string) || "";
    const feeThreshold = student.school.feePaymentThreshold ?? 70;
    const feePolicy = student.school.feePaymentPolicy || "PERCENTAGE";
    
    // Separate completed vs pending payments
    const completedPayments = student.payments.filter((p: any) => p.status === "COMPLETED");
    const pendingPayments = student.payments.filter((p: any) => p.status === "UNDER_REVIEW");
    const paidAmount = completedPayments.reduce((s: number, p: any) => s + p.amount, 0);
    const pendingAmount = pendingPayments.reduce((s: number, p: any) => s + p.amount, 0);

    // Get active term
    let currentTermName = "";
    let currentTermNumber = "";
    let activeTerm: any = null;
    try {
      activeTerm = await db.term.findFirst({
        where: { schoolId: student.schoolId, isActive: true },
        select: { termNumber: true, name: true },
      });
      if (activeTerm) {
        currentTermName = activeTerm.name;
        currentTermNumber = activeTerm.termNumber;
      }
    } catch (_e) {}

    // Get fee structures
    let feeStructures: any[] = [];
    let debugInfo = "";
    try {
      const sg = await db.schoolGrade.findFirst({
        where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
        select: { id: true },
      });
      if (sg) {
        feeStructures = await db.feeStructure.findMany({
          where: { schoolGradeId: sg.id, isActive: true },
          select: { term: true, tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
          orderBy: { term: "asc" },
        });
        debugInfo = `grade-found,fees:${feeStructures.length}`;
      } else {
        debugInfo = "no-schoolgrade";
      }
    } catch (_e) {
      debugInfo = "fee-error";
    }

    // Build per-term breakdown with running payment allocation
    const termOrder = ["TERM_1", "TERM_2", "TERM_3"];
    let runningPaid = paidAmount;
    const termBreakdown: StudentAccessStatus["termBreakdown"] = [];
    
    for (const t of termOrder) {
      const tFees = feeStructures.filter((f: any) => f.term === t);
      const tTotal = tFees.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
      if (tTotal > 0) {
        const applied = Math.min(runningPaid, tTotal);
        runningPaid -= applied;
        termBreakdown.push({
          term: t,
          label: t.replace("_", " "),
          isCurrent: activeTerm?.termNumber === t,
          total: tTotal,
          paid: applied,
          owed: Math.max(0, tTotal - applied),
        });
      }
    }

    // Calculate fees up to and including current term
    const currentIdx = activeTerm ? termOrder.indexOf(activeTerm.termNumber) : -1;
    const termsToCount = currentIdx >= 0 ? termOrder.slice(0, currentIdx + 1) : termOrder;
    const totalFeesUpToCurrentTerm = feeStructures
      .filter((f: any) => termsToCount.includes(f.term))
      .reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);

    const totalAllFees = feeStructures.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
    
    // Use fees up to current term for percentage calculation
    const totalFees = totalFeesUpToCurrentTerm || totalAllFees;
    const feePercent = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 100;
    const balanceDue = Math.max(0, totalFees - paidAmount);

    // Determine if fees are met
    let feesMet = false;
    if (student.feePaid) {
      feesMet = true;
    } else if (totalFees === 0) {
      feesMet = true;
    } else if (feePolicy === "FLEXIBLE") {
      feesMet = true;
    } else if (feePolicy === "FULL") {
      feesMet = feePercent >= 100;
    } else {
      feesMet = feePercent >= feeThreshold;
    }

    // Build reasons
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
    if (isSuspended) {
      reasons.push(suspendReason || "Your access has been suspended. Contact the school.");
    }
    if (!feesMet && totalFees > 0) {
      reasons.push(
        feePolicy === "FULL"
          ? `Full payment required (${feePercent}% paid).`
          : `Pay at least ${feeThreshold}% of fees (${feePercent}% paid). Balance: ${balanceDue.toLocaleString()}.`
      );
    }

    // hasFullAccess: approved AND (fees met or flexible) AND not suspended
    const hasFullAccess = isApproved && feesMet && !isSuspended;

    return {
      hasFullAccess,
      isApproved,
      approvalStatus: student.approvalStatus,
      isSuspended,
      suspendReason,
      feesMet,
      feePercent,
      totalFees,
      paidAmount,
      pendingAmount,
      balanceDue,
      feePolicy,
      feeThreshold,
      currentTermName,
      currentTermNumber,
      termBreakdown,
      reasons,
      debug: debugInfo + `,term:${currentTermNumber},suspended:${isSuspended}`,
    };
  } catch (err: any) {
    return null;
  }
}
