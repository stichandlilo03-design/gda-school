import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";

export default async function ParentAttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: { children: { include: { student: { include: {
      user: { select: { name: true } },
      school: { select: { name: true } },
      attendances: { orderBy: { date: "desc" }, take: 50, include: { class: { include: { subject: true } } } },
    } } } } },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  return (
    <>
      <DashboardHeader title="Attendance" subtitle="Track your children's class attendance" />
      <div className="p-6 lg:p-8 space-y-6">
        {parent.children.map((link) => {
          const child = link.student;
          const att = child.attendances || [];
          const present = att.filter((a: any) => a.status === "PRESENT").length;
          const absent = att.filter((a: any) => a.status === "ABSENT").length;
          const late = att.filter((a: any) => a.status === "LATE").length;
          const pct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;
          return (
            <div key={link.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold">{child.user.name}</h3>
                  <p className="text-[10px] text-gray-500">{child.school.name} · {child.gradeLevel}</p>
                </div>
                <div className={`text-lg font-bold px-3 py-1 rounded-xl ${pct >= 80 ? "bg-emerald-100 text-emerald-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {pct}%
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg text-center"><div className="text-sm font-bold">{att.length}</div><div className="text-[8px] text-gray-500">Total</div></div>
                <div className="p-2 bg-emerald-50 rounded-lg text-center"><div className="text-sm font-bold text-emerald-600">{present}</div><div className="text-[8px] text-emerald-500">Present</div></div>
                <div className="p-2 bg-red-50 rounded-lg text-center"><div className="text-sm font-bold text-red-600">{absent}</div><div className="text-[8px] text-red-500">Absent</div></div>
                <div className="p-2 bg-amber-50 rounded-lg text-center"><div className="text-sm font-bold text-amber-600">{late}</div><div className="text-[8px] text-amber-500">Late</div></div>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {att.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg text-[10px]">
                    <span className="text-gray-500">{new Date(a.date).toLocaleDateString()}</span>
                    <span className="font-medium">{a.class?.subject?.name || a.class?.name || "Class"}</span>
                    <span className={`px-1.5 py-0.5 rounded font-medium ${a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : a.status === "LATE" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
                  </div>
                ))}
                {att.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4">No attendance records yet</p>}
              </div>
            </div>
          );
        })}
        {parent.children.length === 0 && (
          <div className="card text-center py-12"><p className="text-sm text-gray-500">Link your children to see their attendance</p></div>
        )}
      </div>
    </>
  );
}
