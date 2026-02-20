import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ParentProfileClient from "./parent-profile-client";

export default async function ParentProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true, phone: true, countryCode: true, image: true } },
      children: { include: { student: { include: { user: { select: { name: true } }, school: { select: { name: true } } } } } },
    },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  return (
    <>
      <DashboardHeader title="My Profile" subtitle="Your parent/guardian account details" />
      <div className="p-6 lg:p-8">
        <ParentProfileClient parent={JSON.parse(JSON.stringify(parent))} />
      </div>
    </>
  );
}
