import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import GradingOversight from "./grading-oversight";

export default async function PrincipalGradingPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: { select: { id: true, countryCode: true } } },
  });
  if (!principal) return null;

  // Get pending grade submissions
  const pendingAssessments = await db.assessment.findMany({
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

  // Get all approved assessments
  const approvedAssessments = await db.assessment.findMany({
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

  // Get terms for report generation
  const terms = await db.term.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { startDate: "desc" },
  });

  // Get term reports
  const termReports = await db.termReport.findMany({
    where: { schoolId: principal.schoolId },
    include: {
      student: { include: { user: { select: { name: true } } } },
      term: true,
      subjectReports: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <DashboardHeader title="Grading & Reports" subtitle="Approve grades, generate reports, and manage promotions" />
      <div className="p-6 lg:p-8">
        <GradingOversight
          pendingAssessments={JSON.parse(JSON.stringify(pendingAssessments))}
          approvedAssessments={JSON.parse(JSON.stringify(approvedAssessments))}
          terms={JSON.parse(JSON.stringify(terms))}
          termReports={JSON.parse(JSON.stringify(termReports))}
          countryCode={principal.school.countryCode}
        />
      </div>
    </>
  );
}
