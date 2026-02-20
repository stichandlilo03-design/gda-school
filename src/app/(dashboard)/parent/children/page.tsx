import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ChildrenManager from "./children-manager";

export default async function ParentChildrenPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, image: true } },
              school: { select: { name: true, logo: true, primaryColor: true, currency: true } },
              enrollments: { where: { status: "ACTIVE" }, include: { class: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } } } } } },
              attendances: { orderBy: { date: "desc" }, take: 10 },
            },
          },
        },
      },
    },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  return (
    <>
      <DashboardHeader title="My Children" subtitle="Manage and view your children's profiles" />
      <div className="p-6 lg:p-8">
        <ChildrenManager parent={JSON.parse(JSON.stringify(parent))} />
      </div>
    </>
  );
}
