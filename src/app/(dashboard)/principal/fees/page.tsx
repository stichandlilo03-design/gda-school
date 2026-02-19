import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import FeeManager from "./fee-manager";

export default async function FeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });
  if (!principal) return null;

  const grades = await db.schoolGrade.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { gradeLevel: "asc" },
  });

  const fees = await db.feeStructure.findMany({
    where: { schoolId: principal.schoolId },
    include: { schoolGrade: true },
    orderBy: { term: "asc" },
  });

  return (
    <>
      <DashboardHeader title="School Fees" subtitle={`Currency: ${principal.school.currency}`} />
      <div className="p-6 lg:p-8">
        <FeeManager grades={JSON.parse(JSON.stringify(grades))} fees={JSON.parse(JSON.stringify(fees))} currency={principal.school.currency} />
      </div>
    </>
  );
}
