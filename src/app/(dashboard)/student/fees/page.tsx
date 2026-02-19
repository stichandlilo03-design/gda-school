import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, DollarSign, Receipt, XCircle,
  Banknote, ShieldCheck
} from "lucide-react";

const STATUS_MAP: Record<string, { icon: any; color: string; label: string }> = {
  PAID: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-100", label: "Paid" },
  PENDING: { icon: Clock, color: "text-amber-600 bg-amber-100", label: "Pending" },
  FAILED: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Failed" },
  REFUNDED: { icon: Receipt, color: "text-blue-600 bg-blue-100", label: "Refunded" },
};

export default async function FeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) return null;

  // Get fee structure for student's grade
  const schoolGrade = await db.schoolGrade.findFirst({
    where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
  });

  let feeStructure = null;
  if (schoolGrade) {
    feeStructure = await db.feeStructure.findFirst({
      where: { schoolGradeId: schoolGrade.id, isActive: true },
    });
  }

  const totalFees = feeStructure
    ? feeStructure.tuitionFee + feeStructure.registrationFee + feeStructure.examFee + feeStructure.technologyFee
    : 0;

  const totalPaid = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const balance = totalFees - totalPaid;
  const currency = student.school?.currency || "USD";

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <>
      <DashboardHeader title="School Fees" subtitle="Your fee structure and payment history" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-2xl">
            <p className="text-brand-200 text-xs mb-1">Total Fees</p>
            <p className="text-3xl font-bold">{currency} {fmt(totalFees)}</p>
            <p className="text-brand-300 text-[10px] mt-1">{student.gradeLevel} • {feeStructure ? `Term ${feeStructure.term}` : "—"}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <p className="text-xs text-gray-500">Total Paid</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{currency} {fmt(totalPaid)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              {balance > 0 ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <ShieldCheck className="w-5 h-5 text-emerald-600" />}
              <p className="text-xs text-gray-500">Balance</p>
            </div>
            <p className={`text-2xl font-bold ${balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {balance > 0 ? `${currency} ${fmt(balance)}` : "Fully Paid ✓"}
            </p>
          </div>
        </div>

        {/* Fee breakdown */}
        {feeStructure && (
          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2"><Receipt className="w-4 h-4" /> Fee Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: "Tuition Fee", amount: feeStructure.tuitionFee },
                { label: "Registration Fee", amount: feeStructure.registrationFee },
                { label: "Exam Fee", amount: feeStructure.examFee },
                { label: "Technology Fee", amount: feeStructure.technologyFee },
              ].filter((f) => f.amount > 0).map((fee, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{fee.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{currency} {fmt(fee.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-sm font-bold text-brand-800">Total</span>
                <span className="text-sm font-bold text-brand-800">{currency} {fmt(totalFees)}</span>
              </div>
            </div>
          </div>
        )}

        {!feeStructure && (
          <div className="card text-center py-10">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Fee structure has not been set for your grade level yet.</p>
            <p className="text-xs text-gray-400 mt-1">Contact your school administration for fee information.</p>
          </div>
        )}

        {/* Payment progress */}
        {totalFees > 0 && (
          <div className="card">
            <h3 className="section-title mb-3">Payment Progress</h3>
            <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
              <div className={`h-4 rounded-full transition-all ${totalPaid >= totalFees ? "bg-emerald-500" : "bg-brand-500"}`}
                style={{ width: `${Math.min(100, Math.round((totalPaid / totalFees) * 100))}%` }} />
            </div>
            <p className="text-xs text-gray-500">{Math.round((totalPaid / totalFees) * 100)}% paid</p>
          </div>
        )}

        {/* Payment history */}
        <div className="card">
          <h3 className="section-title mb-4 flex items-center gap-2"><Banknote className="w-4 h-4" /> Payment History</h3>
          {student.payments.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {student.payments.map((p) => {
                const st = STATUS_MAP[p.status] || STATUS_MAP.PENDING;
                const Icon = st.icon;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${st.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{p.description}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        {p.paymentMethod && ` • ${p.paymentMethod}`}
                        {p.transactionRef && ` • Ref: ${p.transactionRef.slice(0, 12)}...`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{p.currency} {fmt(p.amount)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.color} font-medium`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
