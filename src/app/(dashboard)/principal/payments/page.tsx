import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import PaymentReviewer from "./payment-reviewer";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });
  if (!principal) return null;

  // Fetch payments WITHOUT proofUrl to keep the page load fast
  // (proofUrl can be huge base64 — we'll load it on demand)
  const payments = await db.payment.findMany({
    where: { student: { schoolId: principal.schoolId } },
    select: {
      id: true, amount: true, currency: true, description: true, status: true,
      paymentMethod: true, transactionRef: true, proofNote: true,
      proofUrl: true, rejectedReason: true, reviewedAt: true, paidAt: true, createdAt: true,
      student: {
        select: {
          id: true, gradeLevel: true,
          user: { select: { name: true, email: true, image: true, countryCode: true } },
        },
      },
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
          currency={principal.school.currency}
        />
      </div>
    </>
  );
}
