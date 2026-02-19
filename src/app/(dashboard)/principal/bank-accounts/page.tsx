import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import BankAccountManager from "./bank-manager";

export default async function BankAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return null;

  const accounts = await db.schoolBankAccount.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <DashboardHeader title="Bank Accounts" subtitle="Payment accounts for students to send fees" />
      <div className="p-6 lg:p-8">
        <BankAccountManager accounts={JSON.parse(JSON.stringify(accounts))} />
      </div>
    </>
  );
}
