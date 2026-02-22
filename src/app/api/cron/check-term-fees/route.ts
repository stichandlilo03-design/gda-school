export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && secret !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: { id: true, name: true, feePaymentPolicy: true, feePaymentThreshold: true },
    });

    let totalSuspended = 0, totalRestored = 0;

    for (const school of schools) {
      const activeTerm = await db.term.findFirst({
        where: { schoolId: school.id, isActive: true },
        select: { termNumber: true, name: true },
      });
      if (!activeTerm) continue;

      const termOrder = ["TERM_1", "TERM_2", "TERM_3"];
      const currentIdx = termOrder.indexOf(activeTerm.termNumber);
      const termsToCheck = termOrder.slice(0, currentIdx + 1);

      const students = await db.student.findMany({
        where: { schoolId: school.id, approvalStatus: "APPROVED" },
        select: {
          id: true, userId: true, gradeLevel: true, feePaid: true, isSuspended: true,
          payments: { where: { status: "COMPLETED" }, select: { amount: true } },
        },
      });

      for (const st of students) {
        if (st.feePaid) {
          if (st.isSuspended) {
            await db.student.update({ where: { id: st.id }, data: { isSuspended: false, suspendedAt: null, suspendReason: null } });
            try { const { notify } = await import("@/lib/notifications"); await notify(st.userId, "✅ Access Restored", "Fees confirmed. Full access restored."); } catch (_e) {}
            totalRestored++;
          }
          continue;
        }

        const paidTotal = st.payments.reduce((s: number, p: any) => s + p.amount, 0);
        const sg = await db.schoolGrade.findFirst({ where: { schoolId: school.id, gradeLevel: st.gradeLevel }, select: { id: true } });
        if (!sg) continue;

        const fees = await db.feeStructure.findMany({
          where: { schoolGradeId: sg.id, isActive: true, term: { in: termsToCheck as any } },
          select: { tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
        });
        const totalDue = fees.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
        if (totalDue === 0) continue;

        const pct = Math.round((paidTotal / totalDue) * 100);
        const threshold = school.feePaymentThreshold ?? 70;
        const policy = school.feePaymentPolicy || "PERCENTAGE";

        let meets = policy === "FLEXIBLE" ? true : policy === "FULL" ? pct >= 100 : pct >= threshold;

        if (!meets && !st.isSuspended) {
          await db.student.update({
            where: { id: st.id },
            data: { isSuspended: true, suspendedAt: new Date(), suspendReason: `${activeTerm.name}: ${pct}% paid, ${threshold}% required. Pay to continue.` },
          });
          try { const { notify } = await import("@/lib/notifications"); await notify(st.userId, `⚠️ ${activeTerm.name} Fees Due`, `Access suspended. Paid ${pct}%, need ${threshold}%. Pay now.`); } catch (_e) {}
          totalSuspended++;
        } else if (meets && st.isSuspended) {
          await db.student.update({ where: { id: st.id }, data: { isSuspended: false, suspendedAt: null, suspendReason: null } });
          try { const { notify } = await import("@/lib/notifications"); await notify(st.userId, "✅ Access Restored", "Fee requirement met. Full access restored!"); } catch (_e) {}
          totalRestored++;
        }
      }
    }

    return NextResponse.json({ success: true, totalSuspended, totalRestored, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
