import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import BrowseClasses from "./browse-classes";

export default async function StudentTeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: { select: { classId: true } },
      enrollmentRequests: { select: { classId: true, status: true } },
    },
  });
  if (!student) return null;

  const classes = await db.class.findMany({
    where: {
      schoolGrade: { schoolId: student.schoolId },
      isActive: true,
    },
    include: {
      teacher: {
        include: {
          user: { select: { name: true, email: true, image: true } },
        },
      },
      schoolGrade: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ schoolGrade: { gradeLevel: "asc" } }, { name: "asc" }],
  });

  const enrolledClassIds = student.enrollments.map((e) => e.classId);
  const pendingRequestIds = student.enrollmentRequests.filter((r) => r.status === "PENDING").map((r) => r.classId);
  const declinedRequestIds = student.enrollmentRequests.filter((r) => r.status === "DECLINED").map((r) => r.classId);

  return (
    <>
      <DashboardHeader title="Browse Classes & Teachers" subtitle="Find and request to join classes" />
      <div className="p-6 lg:p-8">
        <BrowseClasses
          classes={JSON.parse(JSON.stringify(classes))}
          enrolledClassIds={enrolledClassIds}
          pendingRequestIds={pendingRequestIds}
          declinedRequestIds={declinedRequestIds}
          studentApproved={student.approvalStatus === "APPROVED"}
          studentGrade={student.gradeLevel}
        />
      </div>
    </>
  );
}
