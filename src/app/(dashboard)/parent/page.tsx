import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import ParentDashboardClient from "./parent-dashboard-client";

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true, phone: true, countryCode: true, image: true } },
      children: {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, image: true } },
              school: { select: { name: true, logo: true, primaryColor: true, currency: true } },
              enrollments: {
                where: { status: "ACTIVE" },
                include: {
                  class: {
                    include: {
                      subject: true,
                      teacher: { include: { user: { select: { name: true } } } },
                      schedules: { where: { dayOfWeek: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] as any } },
                    },
                  },
                },
              },
              attendances: { orderBy: { date: "desc" }, take: 30 },
              scores: { orderBy: { createdAt: "desc" }, take: 10, include: { assessment: { select: { title: true, maxScore: true, type: true } }, class: { include: { subject: true } } } },
              payments: { orderBy: { createdAt: "desc" }, take: 5, include: { feeStructure: true } },
            },
          },
        },
      },
    },
  });

  if (!parent) return <div className="p-8">Parent profile not found. Contact support.</div>;

  return (
    <>
      <DashboardHeader title={`Welcome, ${parent.user.name}`} subtitle="Track your children's education in one place" />
      <div className="p-6 lg:p-8">
        <ParentDashboardClient parent={JSON.parse(JSON.stringify(parent))} />
      </div>
    </>
  );
}
