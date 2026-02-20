import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ParentFeeClient from "./parent-fee-client";

export default async function ParentFeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              school: {
                select: {
                  name: true, currency: true, id: true,
                  feePaymentPolicy: true, feePaymentThreshold: true, feeInstructions: true,
                },
              },
              payments: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      },
    },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  const schoolIds = [...new Set(parent.children.map(c => c.student.school.id))];

  const feeStructures = await db.feeStructure.findMany({
    where: { schoolId: { in: schoolIds }, isActive: true },
    include: { schoolGrade: true },
  });

  const bankAccounts = await db.schoolBankAccount.findMany({
    where: { schoolId: { in: schoolIds }, isActive: true },
  });

  return (
    <>
      <DashboardHeader title="Fees & Payments" subtitle="Pay fees and track payment status for all children" />
      <div className="p-6 lg:p-8">
        <ParentFeeClient
          parent={JSON.parse(JSON.stringify(parent))}
          feeStructures={JSON.parse(JSON.stringify(feeStructures))}
          bankAccounts={JSON.parse(JSON.stringify(bankAccounts))}
        />
      </div>
    </>
  );
}
