import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { TrendingUp, BookOpen, Award } from "lucide-react";

export default async function GradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      scores: {
        include: {
          assessment: {
            include: { class: { select: { name: true, teacher: { include: { user: { select: { name: true } } } } } } },
          },
        },
        orderBy: { gradedAt: "desc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              assessments: {
                include: { scores: { where: { studentId: undefined } } },
              },
            },
          },
        },
      },
    },
  });

  // Group scores by class
  const scoresByClass: Record<string, { className: string; teacherName: string; scores: any[] }> = {};
  student?.scores.forEach((score) => {
    const classId = score.assessment.classId;
    if (!scoresByClass[classId]) {
      scoresByClass[classId] = {
        className: score.assessment.class.name,
        teacherName: score.assessment.class.teacher.user.name,
        scores: [],
      };
    }
    scoresByClass[classId].scores.push(score);
  });

  const totalScores = student?.scores.length || 0;
  const avgScore = totalScores > 0
    ? (student!.scores.reduce((sum, s) => sum + (s.score || 0), 0) / totalScores).toFixed(1)
    : "—";

  return (
    <>
      <DashboardHeader title="My Grades" subtitle="Track your academic performance" />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <TrendingUp className="w-8 h-8 text-brand-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{avgScore}</div>
            <div className="text-xs text-gray-500">Average Score</div>
          </div>
          <div className="stat-card">
            <BookOpen className="w-8 h-8 text-emerald-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalScores}</div>
            <div className="text-xs text-gray-500">Graded Assessments</div>
          </div>
          <div className="stat-card">
            <Award className="w-8 h-8 text-amber-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{Object.keys(scoresByClass).length}</div>
            <div className="text-xs text-gray-500">Subjects Graded</div>
          </div>
        </div>

        {/* Grades by Class */}
        {Object.keys(scoresByClass).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(scoresByClass).map(([classId, data]) => (
              <div key={classId} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {data.className.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{data.className}</h3>
                    <p className="text-xs text-gray-500">Teacher: {data.teacherName}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="table-header px-4 py-2">Assessment</th>
                        <th className="table-header px-4 py-2">Type</th>
                        <th className="table-header px-4 py-2">Score</th>
                        <th className="table-header px-4 py-2">Max</th>
                        <th className="table-header px-4 py-2">%</th>
                        <th className="table-header px-4 py-2">Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.scores.map((score: any) => {
                        const pct = score.assessment.maxScore > 0 ? ((score.score || 0) / score.assessment.maxScore * 100) : 0;
                        return (
                          <tr key={score.id} className="border-b border-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-800">{score.assessment.title}</td>
                            <td className="px-4 py-2"><span className="badge-info text-[10px]">{score.assessment.type.replace(/_/g, " ")}</span></td>
                            <td className="px-4 py-2 text-sm font-bold text-gray-900">{score.score ?? "—"}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{score.assessment.maxScore}</td>
                            <td className="px-4 py-2">
                              <span className={`text-sm font-bold ${pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                {pct.toFixed(0)}%
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-500 max-w-[200px] truncate">{score.feedback || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No grades yet. Your scores will appear here once teachers enter them.</p>
          </div>
        )}
      </div>
    </>
  );
}
