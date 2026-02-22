import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherVacancyList from "./vacancy-list";

export default async function TeacherVacanciesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


    let teacher: any = null;
  let vacancies: any = null;
try {
    teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });

    vacancies = await db.vacancy.findMany({
      where: { status: "OPEN", isPublic: true },
      include: {
        school: { select: { name: true, countryCode: true, motto: true } },
        _count: { select: { applications: true } },
        applications: teacher ? { where: { teacherId: teacher.id } } : false,
      },
      orderBy: { createdAt: "desc" },
    });

  } catch (err: any) {
    console.error("vacancies page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="Job Board" subtitle="Browse and apply to teaching positions" />
      <div className="p-6 lg:p-8">
        <TeacherVacancyList
          vacancies={JSON.parse(JSON.stringify(vacancies))}
          teacherName={session.user.name}
          teacherEmail={session.user.email}
        />
      </div>
    </>
  );
}
