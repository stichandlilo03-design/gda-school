import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import SchoolSettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });

  if (!principal) return <div>Principal not found</div>;

  return (
    <>
      <DashboardHeader title="School Settings" subtitle="Configure your school branding and rules" />
      <div className="p-6 lg:p-8">
        <SchoolSettingsForm school={JSON.parse(JSON.stringify(principal.school))} />
      </div>
    </>
  );
}
