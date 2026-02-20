import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import VacancyManager from "./vacancy-manager";

export default async function VacanciesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id }, include: { school: true } });
  if (!principal) return null;

  const vacancies = await db.vacancy.findMany({
    where: { schoolId: principal.schoolId },
    include: {
      applications: {
        include: {
          teacher: { include: { user: { select: { name: true, email: true } } } },
          interviews: { orderBy: { scheduledAt: "desc" }, take: 1 },
        },
        orderBy: { appliedAt: "desc" },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <DashboardHeader title="Vacancies & Job Board" subtitle="Post positions and review applicants" />
      <div className="p-6 lg:p-8">
        <VacancyManager vacancies={JSON.parse(JSON.stringify(vacancies))} currency={principal.school.currency} />
      </div>
    </>
  );
}
