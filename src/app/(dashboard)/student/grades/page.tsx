import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { BarChart3, TrendingUp, Award, BookOpen, ChevronDown } from "lucide-react";

function getGrade(pct: number) {
  if (pct >= 90) return { letter: "A+", color: "text-emerald-700 bg-emerald-100" };
  if (pct >= 80) return { letter: "A", color: "text-emerald-700 bg-emerald-100" };
  if (pct >= 70) return { letter: "B", color: "text-blue-700 bg-blue-100" };
  if (pct >= 60) return { letter: "C", color: "text-amber-700 bg-amber-100" };
  if (pct >= 50) return { letter: "D", color: "text-orange-700 bg-orange-100" };
  return { letter: "F", color: "text-red-700 bg-red-100" };
}

export default async function GradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      scores: {
        include: {
          assessment: {
            include: {
              class: {
                include: {
                  teacher: { include: { user: { select: { name: true } } } },
                  schoolGrade: true,
                },
              },
            },
          },
        },
        orderBy: { gradedAt: "desc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { include: { schoolGrade: true } } },
      },
    },
  });

  if (!student) return null;

  // Group scores by class
  const classScores: Record<string, { className: string; teacher: string; grade: string; scores: any[] }> = {};

  student.scores.forEach((s) => {
    const cls = s.assessment.class;
    if (!cls) return;
    if (!classScores[cls.id]) {
      classScores[cls.id] = {
        className: cls.name,
        teacher: cls.teacher?.user?.name || "—",
        grade: cls.schoolGrade?.gradeLevel || "",
        scores: [],
      };
    }
    classScores[cls.id].scores.push(s);
  });

  // Overall stats
  const allGraded = student.scores.filter((s) => s.score !== null);
  const overallAvg = allGraded.length > 0
    ? Math.round(allGraded.reduce((sum, s) => sum + ((s.score! / s.assessment.maxScore) * 100), 0) / allGraded.length)
    : null;
  const bestScore = allGraded.length > 0
    ? Math.max(...allGraded.map((s) => Math.round((s.score! / s.assessment.maxScore) * 100)))
    : null;

  return (
    <>
      <DashboardHeader title="My Grades" subtitle="Track your academic performance" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card text-center">
            <BarChart3 className="w-6 h-6 text-brand-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{overallAvg !== null ? `${overallAvg}%` : "—"}</div>
            <div className="text-[10px] text-gray-500">Overall Average</div>
          </div>
          <div className="stat-card text-center">
            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{bestScore !== null ? `${bestScore}%` : "—"}</div>
            <div className="text-[10px] text-gray-500">Best Score</div>
          </div>
          <div className="stat-card text-center">
            <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{allGraded.length}</div>
            <div className="text-[10px] text-gray-500">Graded Assessments</div>
          </div>
          <div className="stat-card text-center">
            <Award className="w-6 h-6 text-amber-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{overallAvg !== null ? getGrade(overallAvg).letter : "—"}</div>
            <div className="text-[10px] text-gray-500">Overall Grade</div>
          </div>
        </div>

        {Object.keys(classScores).length === 0 ? (
          <div className="card text-center py-16">
            <BarChart3 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-2">No Grades Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">Your test scores, CA, and exam results will appear here as your teachers grade your work.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(classScores).map(([classId, data]) => {
              const graded = data.scores.filter((s) => s.score !== null);
              const classAvg = graded.length > 0
                ? Math.round(graded.reduce((sum, s) => sum + ((s.score! / s.assessment.maxScore) * 100), 0) / graded.length)
                : null;
              const g = classAvg !== null ? getGrade(classAvg) : null;

              return (
                <div key={classId} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{data.className}</h3>
                      <p className="text-[10px] text-gray-500">{data.teacher} • {data.grade}</p>
                    </div>
                    {g && (
                      <div className="text-right">
                        <span className={`text-lg font-bold px-3 py-1 rounded-lg ${g.color}`}>{g.letter}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{classAvg}% avg</p>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {classAvg !== null && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                      <div className={`h-2 rounded-full transition-all ${classAvg >= 70 ? "bg-emerald-500" : classAvg >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${classAvg}%` }} />
                    </div>
                  )}

                  <div className="space-y-2">
                    {data.scores.map((s) => {
                      const pct = s.score !== null ? Math.round((s.score / s.assessment.maxScore) * 100) : null;
                      const sg = pct !== null ? getGrade(pct) : null;
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                          {sg ? (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${sg.color}`}>{sg.letter}</div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-400">—</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{s.assessment.title}</p>
                            <p className="text-[10px] text-gray-500">
                              {s.assessment.type.replace(/_/g, " ")}
                              {s.gradedAt && ` • Graded ${new Date(s.gradedAt).toLocaleDateString()}`}
                            </p>
                            {s.feedback && <p className="text-[10px] text-blue-600 mt-0.5 italic">💬 {s.feedback}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {s.score !== null ? (
                              <>
                                <p className="text-sm font-bold text-gray-800">{s.score}/{s.assessment.maxScore}</p>
                                <p className="text-[10px] text-gray-400">{pct}%</p>
                              </>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Not graded</span>
                            )}
                          </div>
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
    </>
  );
}
