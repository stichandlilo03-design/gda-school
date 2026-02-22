export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import SchoolInfoView from "@/components/school-info-view";

export default async function StudentSchoolInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        select: {
          name: true, motto: true, primaryColor: true, secondaryColor: true,
          anthemLyrics: true, nationalAnthem: true, rulesText: true, countryCode: true,
        },
      },
    },
  });

  if (!student?.school) return <div className="p-8 text-center text-gray-400">No school found</div>;

  return (
    <>
      <DashboardHeader title="School Info" subtitle="Anthem, national anthem, and rules" />
      <div className="p-6 lg:p-8">
        <SchoolInfoView school={student.school} />
      </div>
    </>
  );
}
