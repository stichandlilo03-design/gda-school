import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentProfileClient from "./student-profile-client";

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true, phone: true, countryCode: true, image: true } },
      school: { select: { name: true, logo: true, primaryColor: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { include: { subject: true } } },
      },
    },
  });

  if (!student) return <div className="p-8">Not found.</div>;

  return (
    <>
      <DashboardHeader title="My Profile & ID Card" subtitle="Upload your photo and download your student ID" />
      <div className="p-6 lg:p-8">
        <StudentProfileClient student={JSON.parse(JSON.stringify(student))} />
      </div>
    </>
  );
}
