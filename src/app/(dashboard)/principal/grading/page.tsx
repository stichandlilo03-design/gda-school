import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import GradingOversight from "./grading-oversight";

export default async function PrincipalGradingPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let pendingAssessments: any[] = [];
  let approvedAssessments: any[] = [];
  let terms: any[] = [];
  let termReports: any[] = [];
  let countryCode = "NG";
  let schoolAssignments: any[] = [];
  let queryError = "";

  try {
    const principal = await db.principal.findUnique({
      where: { userId: session.user.id },
      include: { school: { select: { id: true, countryCode: true } } },
    });
    if (!principal) return <div className="p-8">Not found.</div>;

    countryCode = principal.school.countryCode;

    pendingAssessments = await db.assessment.findMany({
      where: {
        class: { schoolGrade: { schoolId: principal.schoolId } },
        gradeStatus: "SUBMITTED",
      },
      include: {
        class: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } }, schoolGrade: true } },
        scores: { include: { student: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { submittedAt: "desc" },
    });

    approvedAssessments = await db.assessment.findMany({
      where: {
        class: { schoolGrade: { schoolId: principal.schoolId } },
        gradeStatus: "APPROVED",
      },
      include: {
        class: { include: { subject: true, schoolGrade: true } },
        scores: true,
      },
      orderBy: { approvedAt: "desc" },
      take: 20,
    });

    terms = await db.term.findMany({
      where: { schoolId: principal.schoolId },
      orderBy: { startDate: "desc" },
    });

    termReports = await db.termReport.findMany({
      where: { schoolId: principal.schoolId },
      include: {
        student: { include: { user: { select: { name: true } } } },
        term: true,
        subjectReports: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    schoolAssignments = await db.assignment.findMany({
      where: { class: { schoolGrade: { schoolId: principal.schoolId } }, isActive: true },
      include: {
        class: { include: { subject: true, schoolGrade: true, teacher: { include: { user: { select: { name: true } } } } } },
        submissions: { include: { student: { include: { user: { select: { name: true } } } } }, orderBy: { submittedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (err: any) {
    queryError = err?.message || "Unknown error";
    console.error("Grading page error:", queryError);
  }

  return (
    <>
      <DashboardHeader title="Grading & Reports" subtitle="Approve grades, generate reports, and manage promotions" />
      <div className="p-6 lg:p-8">
        {queryError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-bold">⚠️ Error loading grading data</p>
            <p className="text-xs mt-1 text-red-500">{queryError}</p>
            <a href="/principal/grading" className="text-xs underline mt-2 inline-block">Try Again</a>
          </div>
        )}
        <GradingOversight
          pendingAssessments={JSON.parse(JSON.stringify(pendingAssessments))}
          approvedAssessments={JSON.parse(JSON.stringify(approvedAssessments))}
          terms={JSON.parse(JSON.stringify(terms))}
          termReports={JSON.parse(JSON.stringify(termReports))}
          assignments={JSON.parse(JSON.stringify(schoolAssignments))}
          countryCode={countryCode}
        />
      </div>
    </>
  );
}
