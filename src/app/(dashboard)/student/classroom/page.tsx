import { getServerSession } from "next-auth";
import { checkStudentAccess } from "@/lib/student-access";
import StudentAccessGate from "@/components/student-access-gate";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentClassroomClient from "./classroom-client";
import { getGradeLabelForCountry } from "@/lib/education-systems";

export default async function StudentClassroomPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Access gate: block unapproved / unpaid students
  const access = await checkStudentAccess(session.user.id);
  if (access && !access.hasFullAccess) {
    return <StudentAccessGate access={access} pageName="My Classroom" />;
  }


  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: { select: { sessionDurationMin: true, breakDurationMin: true, sessionsPerDay: true, countryCode: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              subject: true,
              teacher: { select: { id: true, rating: true, totalRatings: true, user: { select: { name: true, image: true } } } },
              schoolGrade: true,
              schedules: true,
              announcements: { orderBy: { createdAt: "desc" }, take: 10, include: { teacher: { include: { user: { select: { name: true } } } } } },
              liveSessions: { where: { status: "IN_PROGRESS" }, take: 1 },
              enrollments: {
                where: { status: "ACTIVE" },
                include: { student: { include: { user: { select: { id: true, name: true, image: true } } } } },
                take: 50,
              },
              _count: { select: { enrollments: true, materials: true } },
            },
          },
        },
      },
      attendances: {
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      },
    },
  });

  if (!student) return null;
  const isKG = ["K1", "K2", "K3"].includes(student.gradeLevel);

  // FILTER: Only show classes that match student's grade level
  const myGradeEnrollments = student.enrollments.filter((e: any) =>
    e.class.schoolGrade?.gradeLevel === student.gradeLevel
  );

  return (
    <>
      <DashboardHeader
        title={isKG ? "🏫 My Classroom" : "My Classroom"}
        subtitle={isKG ? "Join your class and learn!" : `${getGradeLabelForCountry(student.gradeLevel, student.school?.countryCode || "")} — Join live classes & view announcements`}
      />
      <div className="p-6 lg:p-8">
        <StudentClassroomClient
          enrollments={JSON.parse(JSON.stringify(myGradeEnrollments))}
          todayAttendance={JSON.parse(JSON.stringify(student.attendances))}
          studentId={student.id}
          studentName={session.user.name || "Student"}
          studentGrade={student.gradeLevel}
          isKG={isKG}
          sessionDurationMin={student.school?.sessionDurationMin || 40}
          breakDurationMin={student.school?.breakDurationMin || 10}
          countryCode={student.school?.countryCode || "NG"}
        />
      </div>
    </>
  );
}
