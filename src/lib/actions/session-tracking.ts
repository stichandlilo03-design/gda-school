"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// TEACHER: Start a live class session (records real start time)
// ============================================================
export async function startClassSession(classId: string, topic?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  const schoolTeacher = await db.schoolTeacher.findFirst({
    where: { teacherId: teacher.id, status: "APPROVED", isActive: true, isSuspended: false, terminatedAt: null },
    include: { salary: true },
  });
  if (!schoolTeacher) return { error: "No active school" };
  if (!schoolTeacher.salary) return { error: "No salary set" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if session already exists today for this class
  const existing = await db.teachingSession.findUnique({
    where: { schoolTeacherId_classId_date: { schoolTeacherId: schoolTeacher.id, classId, date: today } },
  });

  if (existing) {
    if (existing.status === "LIVE") return { error: "Session already in progress!" };
    if (["ENDED", "PENDING_REVIEW", "APPROVED"].includes(existing.status)) return { error: "Session already completed for today." };
  }

  const salary = schoolTeacher.salary;
  const gross = salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances;
  const dailyRate = gross / salary.workingDaysPerMonth;

  const now = new Date();

  if (existing) {
    // Resume a scheduled session
    await db.teachingSession.update({
      where: { id: existing.id },
      data: { status: "LIVE", startedAt: now, topic: topic || existing.topic },
    });
  } else {
    await db.teachingSession.create({
      data: {
        schoolTeacherId: schoolTeacher.id,
        classId,
        date: today,
        startedAt: now,
        status: "LIVE",
        dailyRate,
        amountEarned: 0,
        currency: salary.currency,
        topic,
      },
    });
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/payroll");
  revalidatePath("/principal/payroll");
  return { success: true, startedAt: now.toISOString() };
}

// ============================================================
// TEACHER: End a live session (records real end time, calculates hours)
// ============================================================
export async function endClassSession(classId: string, notes?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  const schoolTeacher = await db.schoolTeacher.findFirst({
    where: { teacherId: teacher.id, status: "APPROVED", isActive: true },
  });
  if (!schoolTeacher) return { error: "No active school" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ts = await db.teachingSession.findUnique({
    where: { schoolTeacherId_classId_date: { schoolTeacherId: schoolTeacher.id, classId, date: today } },
  });

  if (!ts) return { error: "No session found" };
  if (ts.status !== "LIVE") return { error: "Session is not currently live" };
  if (!ts.startedAt) return { error: "Session has no start time" };

  const now = new Date();
  const diffMs = now.getTime() - ts.startedAt.getTime();
  const hoursWorked = Math.round((diffMs / 3600000) * 100) / 100; // Round to 2 decimals

  // Cap at 8 hours max per session
  const cappedHours = Math.min(hoursWorked, 8);

  // Calculate earned: proportional to hours (8 hours = full daily rate)
  const amountEarned = Math.round((ts.dailyRate * (cappedHours / 8)) * 100) / 100;

  await db.teachingSession.update({
    where: { id: ts.id },
    data: {
      endedAt: now,
      hoursWorked: cappedHours,
      amountEarned,
      status: "PENDING_REVIEW",
      notes: notes || null,
    },
  });

  revalidatePath("/teacher");
  revalidatePath("/teacher/payroll");
  revalidatePath("/principal/payroll");
  return {
    success: true,
    hoursWorked: cappedHours,
    amountEarned,
    startedAt: ts.startedAt.toISOString(),
    endedAt: now.toISOString(),
  };
}

// ============================================================
// PRINCIPAL: Approve session (credits teacher)
// ============================================================
export async function approveSession(sessionId: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const ts = await db.teachingSession.findUnique({ where: { id: sessionId } });
  if (!ts) return { error: "Session not found" };
  if (ts.status !== "PENDING_REVIEW") return { error: "Session not pending review" };

  await db.teachingSession.update({
    where: { id: sessionId },
    data: {
      verified: true,
      verifiedBy: session.user.name,
      verifiedAt: new Date(),
      status: "APPROVED",
      reviewNote: note || null,
    },
  });

  revalidatePath("/principal/payroll");
  revalidatePath("/teacher/payroll");
  return { success: true };
}

// ============================================================
// PRINCIPAL: Reject session (teacher earns nothing)
// ============================================================
export async function rejectSession(sessionId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.teachingSession.update({
    where: { id: sessionId },
    data: {
      verified: false,
      verifiedBy: session.user.name,
      verifiedAt: new Date(),
      status: "REJECTED",
      amountEarned: 0,
      reviewNote: reason,
    },
  });

  revalidatePath("/principal/payroll");
  revalidatePath("/teacher/payroll");
  return { success: true };
}

// ============================================================
// PRINCIPAL: Adjust hours on a session (override)
// ============================================================
export async function adjustSessionHours(sessionId: string, adjustedHours: number, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const ts = await db.teachingSession.findUnique({ where: { id: sessionId } });
  if (!ts) return { error: "Session not found" };

  const capped = Math.min(Math.max(adjustedHours, 0), 8);
  const newAmount = Math.round((ts.dailyRate * (capped / 8)) * 100) / 100;

  await db.teachingSession.update({
    where: { id: sessionId },
    data: {
      hoursWorked: capped,
      amountEarned: newAmount,
      verified: true,
      verifiedBy: session.user.name,
      verifiedAt: new Date(),
      status: "APPROVED",
      reviewNote: `Adjusted from ${ts.hoursWorked}h to ${capped}h: ${reason}`,
    },
  });

  revalidatePath("/principal/payroll");
  revalidatePath("/teacher/payroll");
  return { success: true };
}

// ============================================================
// PRINCIPAL: Bulk approve all pending sessions
// ============================================================
export async function bulkApproveSessions(sessionIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.teachingSession.updateMany({
    where: { id: { in: sessionIds }, status: "PENDING_REVIEW" },
    data: {
      verified: true,
      verifiedBy: session.user.name,
      verifiedAt: new Date(),
      status: "APPROVED",
    },
  });

  revalidatePath("/principal/payroll");
  revalidatePath("/teacher/payroll");
  return { success: true };
}
