import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";

export default async function ParentGradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: { children: { include: { student: { include: {
      user: { select: { name: true } },
      school: { select: { name: true } },
      scores: { orderBy: { createdAt: "desc" }, include: { assessment: { include: { class: { include: { subject: true } } } } } },
    } } } } },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  return (
    <>
      <DashboardHeader title="Grades & Reports" subtitle="View your children's academic performance" />
      <div className="p-6 lg:p-8 space-y-6">
        {parent.children.map((link) => {
          const child = link.student;
          const scores = child.scores || [];
          const bySubject: Record<string, any[]> = {};
          scores.forEach((s: any) => {
            const sub = s.assessment?.class?.subject?.name || "Other";
            if (!bySubject[sub]) bySubject[sub] = [];
            bySubject[sub].push(s);
          });

          return (
            <div key={link.id} className="card">
              <h3 className="text-sm font-bold mb-1">{child.user.name}</h3>
              <p className="text-[10px] text-gray-500 mb-4">{child.school.name} · {child.gradeLevel}</p>

              {Object.keys(bySubject).length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-4">No grades recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(bySubject).map(([subject, subScores]) => {
                    const avg = subScores.reduce((s: number, sc: any) => {
                      const pct = sc.assessment?.maxScore > 0 ? (sc.score / sc.assessment.maxScore) * 100 : 0;
                      return s + pct;
                    }, 0) / subScores.length;
                    const color = avg >= 70 ? "text-emerald-600" : avg >= 50 ? "text-amber-600" : "text-red-600";
                    return (
                      <div key={subject}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-700">📚 {subject}</h4>
                          <span className={`text-xs font-bold ${color}`}>Avg: {Math.round(avg)}%</span>
                        </div>
                        <div className="space-y-1">
                          {subScores.map((s: any) => {
                            const pct = s.assessment?.maxScore > 0 ? Math.round((s.score / s.assessment.maxScore) * 100) : 0;
                            const c = pct >= 70 ? "bg-emerald-50 text-emerald-700" : pct >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
                            return (
                              <div key={s.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg text-[10px]">
                                <span className="font-medium">{s.assessment?.title || "Test"}</span>
                                <span className="text-gray-400">{s.assessment?.type?.replace(/_/g, " ")}</span>
                                <span className={`px-2 py-0.5 rounded font-bold ${c}`}>{s.score}/{s.assessment?.maxScore} ({pct}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {parent.children.length === 0 && (
          <div className="card text-center py-12"><p className="text-sm text-gray-500">Link your children to see their grades</p></div>
        )}
      </div>
    </>
  );
}
