"use client";

import { useState } from "react";
import { approveEnrollmentRequest, declineEnrollmentRequest } from "@/lib/actions/enrollment";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Check, X, Bell } from "lucide-react";

export default function EnrollmentAlerts({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = requests.filter((r) => !dismissed.includes(r.id));
  if (visible.length === 0) return null;

  const handleApprove = async (id: string) => {
    setLoading(id);
    const result = await approveEnrollmentRequest(id);
    if (result.error) alert(result.error);
    else setDismissed((p) => [...p, id]);
    router.refresh();
    setLoading("");
  };

  const handleDecline = async (id: string) => {
    setLoading("d-" + id);
    await declineEnrollmentRequest(id);
    setDismissed((p) => [...p, id]);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
          <Bell className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-900">Enrollment Requests ({visible.length})</h3>
          <p className="text-xs text-blue-600">Students want to join your classes</p>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((req) => (
          <div key={req.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              {req.studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{req.studentName}</p>
              <p className="text-xs text-gray-500">{req.studentEmail}</p>
              <p className="text-xs text-brand-600 font-medium mt-0.5">
                Wants to join: <strong>{req.className}</strong> ({req.gradeLevel})
              </p>
              {req.message && <p className="text-xs text-gray-400 mt-0.5 italic">"{req.message}"</p>}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleApprove(req.id)}
                disabled={loading === req.id}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium"
              >
                {loading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Accept</>}
              </button>
              <button
                onClick={() => handleDecline(req.id)}
                disabled={loading === "d-" + req.id}
                className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium"
              >
                {loading === "d-" + req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3" /> Decline</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
