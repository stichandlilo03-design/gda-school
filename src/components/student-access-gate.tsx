import Link from "next/link";
import { Lock, CreditCard, Clock, XCircle, UserCheck, ArrowRight } from "lucide-react";
import type { StudentAccessStatus } from "@/lib/student-access";

export default function StudentAccessGate({ access, pageName }: { access: StudentAccessStatus; pageName: string }) {
  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    INTERVIEW_SCHEDULED: UserCheck,
    INTERVIEWED: Clock,
    REJECTED: XCircle,
  };
  const StatusIcon = statusIcons[access.approvalStatus] || Clock;

  const statusLabels: Record<string, string> = {
    PENDING: "Pending Approval",
    INTERVIEW_SCHEDULED: "Interview Scheduled",
    INTERVIEWED: "Awaiting Decision",
    REJECTED: "Not Approved",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-lg mx-auto mt-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{pageName} is Locked</h2>
          <p className="text-sm text-gray-500">Complete your enrollment to access this feature.</p>
        </div>

        <div className="space-y-3">
          {/* Approval Status */}
          <div className={`p-4 rounded-xl border-2 ${access.isApproved ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-center gap-3">
              {access.isApproved ? (
                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                  <StatusIcon className="w-5 h-5 text-amber-700" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">
                  Step 1: Principal Approval
                </p>
                <p className={`text-xs mt-0.5 ${access.isApproved ? "text-emerald-700" : "text-amber-700"}`}>
                  {access.isApproved ? "✅ Approved — You're admitted!" : `⏳ ${statusLabels[access.approvalStatus] || "Pending"}`}
                </p>
              </div>
              {access.isApproved && <span className="text-emerald-500 text-lg">✓</span>}
            </div>
          </div>

          {/* Fee Status */}
          <div className={`p-4 rounded-xl border-2 ${access.feesMet ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${access.feesMet ? "bg-emerald-200" : "bg-amber-200"} flex items-center justify-center flex-shrink-0`}>
                <CreditCard className={`w-5 h-5 ${access.feesMet ? "text-emerald-700" : "text-amber-700"}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">
                  Step 2: Fee Payment
                </p>
                {access.feesMet ? (
                  <p className="text-xs text-emerald-700 mt-0.5">✅ Fees met — You're all set!</p>
                ) : access.totalFees > 0 ? (
                  <div>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {access.feePolicy === "FULL" ? "Full payment required" : `${access.feeThreshold}% minimum required`}
                    </p>
                    <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${Math.min(access.feePercent, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1">{access.feePercent}% paid</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">No fees set up yet</p>
                )}
              </div>
              {access.feesMet && <span className="text-emerald-500 text-lg">✓</span>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-2">
          {!access.feesMet && access.totalFees > 0 && (
            <Link href="/student/fees" className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition">
              <CreditCard className="w-4 h-4" /> Pay Fees Now <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link href="/student" className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
