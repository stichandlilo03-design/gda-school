import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";

export default async function ParentFeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: { children: { include: { student: { include: {
      user: { select: { name: true } },
      school: { select: { name: true, currency: true } },
      payments: { orderBy: { createdAt: "desc" }, include: { feeStructure: { include: { schoolGrade: true } } } },
    } } } } },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  const fmt = (n: number, c: string) => { try { return new Intl.NumberFormat("en", { style: "currency", currency: c }).format(n); } catch { return `${c} ${n.toLocaleString()}`; } };

  return (
    <>
      <DashboardHeader title="Fees & Payments" subtitle="View payment history for all children" />
      <div className="p-6 lg:p-8 space-y-6">
        {parent.children.map((link) => {
          const child = link.student;
          const payments = child.payments || [];
          const currency = child.school?.currency || "USD";
          const totalPaid = payments.filter((p: any) => p.status === "APPROVED").reduce((s: number, p: any) => s + (p.amount || 0), 0);
          const totalPending = payments.filter((p: any) => p.status === "PENDING").reduce((s: number, p: any) => s + (p.amount || 0), 0);

          return (
            <div key={link.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold">{child.user.name}</h3>
                  <p className="text-[10px] text-gray-500">{child.school.name} · {child.gradeLevel}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-xl ${child.feePaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {child.feePaid ? "✅ Fees Paid" : "⏳ Fees Due"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <div className="text-lg font-bold text-emerald-700">{fmt(totalPaid, currency)}</div>
                  <div className="text-[9px] text-emerald-600">Total Paid</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <div className="text-lg font-bold text-amber-700">{fmt(totalPending, currency)}</div>
                  <div className="text-[9px] text-amber-600">Pending</div>
                </div>
              </div>

              <div className="space-y-1.5">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-[10px]">
                    <div>
                      <span className="font-medium">{p.feeStructure?.term || "Payment"}</span>
                      <span className="text-gray-400 ml-2">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{fmt(p.amount, currency)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${p.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : p.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4">No payment records</p>}
              </div>
            </div>
          );
        })}
        {parent.children.length === 0 && (
          <div className="card text-center py-12"><p className="text-sm text-gray-500">Link your children to see their fee status</p></div>
        )}
      </div>
    </>
  );
}
