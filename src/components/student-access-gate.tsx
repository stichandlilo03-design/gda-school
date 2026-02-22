import Link from "next/link";
import { Lock, CreditCard, Clock, XCircle, UserCheck, ArrowRight, AlertTriangle } from "lucide-react";
import type { StudentAccessStatus } from "@/lib/student-access";

export default function StudentAccessGate({ access, pageName }: { access: StudentAccessStatus; pageName: string }) {
  const statusIcons: Record<string, any> = {
    PENDING: Clock, INTERVIEW_SCHEDULED: UserCheck, INTERVIEWED: Clock, REJECTED: XCircle,
  };
  const StatusIcon = access.isSuspended ? AlertTriangle : (statusIcons[access.approvalStatus] || Clock);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-lg mx-auto mt-12">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${access.isSuspended ? "bg-red-100" : "bg-amber-100"}`}>
            <StatusIcon className={`w-8 h-8 ${access.isSuspended ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{pageName} is Locked</h2>
          <p className="text-sm text-gray-500">
            {access.isSuspended ? "Your access has been suspended." : "Complete your enrollment to access this feature."}
          </p>
        </div>

        {/* Suspension banner */}
        {access.isSuspended && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-4">
            <h3 className="text-base font-bold text-red-800 mb-1">⚠️ Access Suspended</h3>
            <p className="text-sm text-red-700">{access.suspendReason || "Your access has been suspended. Please contact the school."}</p>
            {access.balanceDue > 0 && (
              <div className="mt-3 bg-red-100 rounded-xl p-3">
                <p className="text-sm font-bold text-red-800">Amount Owed: {access.balanceDue.toLocaleString()}</p>
                <p className="text-xs text-red-600">Paid: {access.paidAmount.toLocaleString()} of {access.totalFees.toLocaleString()}</p>
              </div>
            )}
            <Link href="/student/fees" className="inline-block mt-3 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
              💳 Pay Now →
            </Link>
          </div>
        )}

        {/* Approval status */}
        {!access.isApproved && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-4">
            <h3 className="text-sm font-bold text-amber-800 mb-2">Admission Status</h3>
            <p className="text-sm text-amber-700">
              {access.approvalStatus === "PENDING" ? "⏳ Your admission is pending principal review." :
               access.approvalStatus === "INTERVIEW_SCHEDULED" ? "📋 Interview scheduled. Please attend." :
               access.approvalStatus === "INTERVIEWED" ? "✅ Interview complete. Awaiting decision." :
               access.approvalStatus === "REJECTED" ? "❌ Not approved. Contact school." :
               "In progress..."}
            </p>
          </div>
        )}

        {/* Fee status */}
        {access.isApproved && !access.feesMet && !access.isSuspended && access.totalFees > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-800">Fee Payment Required</h3>
            </div>
            <p className="text-sm text-amber-700 mb-2">
              {access.feePolicy === "FULL" ? "Full payment required" : `Minimum ${access.feeThreshold}% payment required`}
              {" — "}currently at {access.feePercent}%
            </p>
            <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${Math.min(access.feePercent, 100)}%` }} />
            </div>
            <p className="text-sm font-bold text-red-600 mb-3">
              Balance: {access.balanceDue.toLocaleString()} — Paid: {access.paidAmount.toLocaleString()} of {access.totalFees.toLocaleString()}
            </p>

            {/* Term breakdown */}
            {access.termBreakdown && access.termBreakdown.length > 0 && (
              <div className="space-y-1 mb-3">
                {access.termBreakdown.map((tb) => (
                  <div key={tb.term} className={`flex justify-between text-xs p-2 rounded-lg ${tb.isCurrent ? "bg-blue-50 border border-blue-200 font-bold" : "bg-white"}`}>
                    <span>{tb.label} {tb.isCurrent && "📌"}</span>
                    <span className={tb.owed > 0 ? "text-red-600 font-bold" : "text-emerald-600"}>{tb.owed > 0 ? `Owes: ${tb.owed.toLocaleString()}` : "✅ Covered"}</span>
                  </div>
                ))}
              </div>
            )}

            <Link href="/student/fees" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700">
              Pay Fees <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <Link href="/student" className="block text-center text-sm text-gray-500 hover:text-brand-600 mt-6">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
