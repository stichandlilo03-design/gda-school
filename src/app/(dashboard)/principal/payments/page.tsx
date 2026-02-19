import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import PaymentReviewer from "./payment-reviewer";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return null;

  const payments = await db.payment.findMany({
    where: { student: { schoolId: principal.schoolId } },
    include: {
      student: { include: { user: { select: { name: true, email: true, image: true, countryCode: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = payments.filter((p) => p.status === "UNDER_REVIEW");
  const approved = payments.filter((p) => p.status === "COMPLETED");
  const rejected = payments.filter((p) => p.status === "REJECTED");
  const totalCollected = approved.reduce((s, p) => s + p.amount, 0);
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <DashboardHeader title="Payment Review" subtitle={`${pending.length} pending • ${approved.length} approved`} />
      <div className="p-6 lg:p-8">
        <PaymentReviewer
          pending={JSON.parse(JSON.stringify(pending))}
          approved={JSON.parse(JSON.stringify(approved))}
          rejected={JSON.parse(JSON.stringify(rejected))}
          totalCollected={totalCollected}
          totalPending={totalPending}
          currency={principal.schoolId ? "USD" : "USD"}
        />
      </div>
    </>
  );
}
