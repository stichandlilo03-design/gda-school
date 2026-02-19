import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ProfileEditor from "./profile-editor";

export default async function TeacherProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true, phone: true, countryCode: true, image: true } },
      schools: {
        where: { status: "APPROVED", isActive: true },
        include: { school: { select: { name: true } } },
      },
      classes: { where: { isActive: true }, select: { id: true, name: true } },
    },
  });

  if (!teacher) return <div className="p-8">Teacher not found.</div>;

  return (
    <>
      <DashboardHeader title="My Profile" subtitle="Manage how students and principals see you" />
      <div className="p-6 lg:p-8">
        <ProfileEditor
          teacher={JSON.parse(JSON.stringify(teacher))}
          user={JSON.parse(JSON.stringify(teacher.user))}
        />
      </div>
    </>
  );
}
