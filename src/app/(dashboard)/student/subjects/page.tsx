import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import SubjectSelector from "./subject-selector";

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              subject: true,
              teacher: { include: { user: { select: { name: true, image: true } } } },
              enrollments: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  // Get school grade for this student
  const schoolGrade = await db.schoolGrade.findFirst({
    where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
    include: {
      subjects: {
        include: { subject: true },
        orderBy: { subject: { name: "asc" } },
      },
    },
  });

  // Get ALL active classes for this grade (grouped by subject)
  const availableClasses = await db.class.findMany({
    where: {
      schoolGrade: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
      isActive: true,
    },
    include: {
      subject: true,
      teacher: {
        include: {
          user: { select: { name: true, image: true, email: true } },
          classes: {
            where: { isActive: true, schoolGrade: { schoolId: student.schoolId, gradeLevel: student.gradeLevel } },
            include: { subject: true },
          },
        },
      },
      enrollments: { where: { status: "ACTIVE" } },
      schedules: true,
      requirements: true,
    },
    orderBy: [{ subject: { name: "asc" } }, { teacher: { rating: "desc" } }],
  });

  return (
    <>
      <DashboardHeader
        title="My Subjects"
        subtitle={`${student.gradeLevel} — ${student.school.name}`}
      />
      <div className="p-6 lg:p-8">
        <SubjectSelector
          gradeSubjects={JSON.parse(JSON.stringify(schoolGrade?.subjects || []))}
          availableClasses={JSON.parse(JSON.stringify(availableClasses))}
          enrollments={JSON.parse(JSON.stringify(student.enrollments))}
          studentId={student.id}
        />
      </div>
    </>
  );
}
