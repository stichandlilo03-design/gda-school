"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Schedule interview for a student
export async function scheduleStudentInterview(data: {
  studentId: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  meetingNotes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PRINCIPAL" && session.user.role !== "TEACHER")) return { error: "Unauthorized" };

  const interview = await db.interview.create({
    data: {
      interviewerId: session.user.id,
      studentId: data.studentId,
      type: "ADMISSION",
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      meetingLink: data.meetingLink,
      meetingNotes: data.meetingNotes,
      status: "SCHEDULED",
    },
  });

  await db.student.update({
    where: { id: data.studentId },
    data: { approvalStatus: "INTERVIEW_SCHEDULED" },
  });

  // Notify student about the interview
  try {
    const student = await db.student.findUnique({
      where: { id: data.studentId },
      select: { userId: true, parentEmail: true, gradeLevel: true },
    });
    if (student) {
      const { notify } = await import("@/lib/notifications");
      const dt = new Date(data.scheduledAt);
      const dateStr = dt.toLocaleDateString();
      const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      await notify(student.userId,
        "📅 Interview Scheduled",
        `Your admission interview has been scheduled for ${dateStr} at ${timeStr} (${data.duration} minutes).${data.meetingLink ? ` Meeting link: ${data.meetingLink}` : " Please come to the school."} ${data.meetingNotes || ""}`
      );
    }
  } catch (_e) {}

  revalidatePath("/principal/students");
  revalidatePath("/principal/interviews");
  return { success: true, interviewId: interview.id };
}

// Schedule interview for a teacher
export async function scheduleTeacherInterview(data: {
  schoolTeacherId: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  meetingNotes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const interview = await db.interview.create({
    data: {
      interviewerId: session.user.id,
      schoolTeacherId: data.schoolTeacherId,
      type: "HIRING",
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      meetingLink: data.meetingLink,
      meetingNotes: data.meetingNotes,
      status: "SCHEDULED",
    },
  });

  await db.schoolTeacher.update({
    where: { id: data.schoolTeacherId },
    data: { status: "INTERVIEW_SCHEDULED" },
  });

  revalidatePath("/principal/teachers");
  revalidatePath("/principal/interviews");
  return { success: true, interviewId: interview.id };
}

// Schedule interview for a vacancy applicant
export async function scheduleVacancyInterview(data: {
  vacancyAppId: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const interview = await db.interview.create({
    data: {
      interviewerId: session.user.id,
      vacancyAppId: data.vacancyAppId,
      type: "VACANCY",
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      meetingLink: data.meetingLink,
      status: "SCHEDULED",
    },
  });

  await db.vacancyApplication.update({
    where: { id: data.vacancyAppId },
    data: { status: "INTERVIEW_SCHEDULED" },
  });

  revalidatePath("/principal/vacancies");
  revalidatePath("/principal/interviews");
  return { success: true, interviewId: interview.id };
}

// Submit interview results
export async function submitInterviewResult(data: {
  interviewId: string;
  result: string;
  scoreOverall: number;
  scoreCommunication?: number;
  scoreKnowledge?: number;
  scoreAttitude?: number;
  scoreExperience?: number;
  feedback: string;
  recommendation?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const interview = await db.interview.update({
    where: { id: data.interviewId },
    data: {
      result: data.result as any,
      scoreOverall: data.scoreOverall,
      scoreCommunication: data.scoreCommunication,
      scoreKnowledge: data.scoreKnowledge,
      scoreAttitude: data.scoreAttitude,
      scoreExperience: data.scoreExperience,
      feedback: data.feedback,
      recommendation: data.recommendation,
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: { student: true, schoolTeacher: true, vacancyApp: true },
  });

  // Update candidate status based on interview type
  if (interview.studentId && interview.student) {
    await db.student.update({
      where: { id: interview.studentId },
      data: { approvalStatus: "INTERVIEWED" },
    });
    // Notify student
    try {
      const { notify } = await import("@/lib/notifications");
      await notify(interview.student.userId,
        "✅ Interview Completed",
        `Your admission interview has been completed. The principal will review your results and make a decision. ${data.result === "PASS" ? "Your interview went well!" : data.result === "CONDITIONAL" ? "There are some conditions to discuss." : "Please contact the school for more details."}`
      );
    } catch (_e) {}
  }

  if (interview.schoolTeacherId && interview.schoolTeacher) {
    await db.schoolTeacher.update({
      where: { id: interview.schoolTeacherId },
      data: { status: "INTERVIEWED" },
    });
  }

  if (interview.vacancyAppId) {
    await db.vacancyApplication.update({
      where: { id: interview.vacancyAppId },
      data: { status: "INTERVIEWED" },
    });
  }

  revalidatePath("/principal/interviews");
  revalidatePath("/principal/students");
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/vacancies");
  return { success: true };
}

// Mark interview as no-show
export async function markInterviewNoShow(interviewId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await db.interview.update({
    where: { id: interviewId },
    data: { status: "NO_SHOW", completedAt: new Date() },
  });

  revalidatePath("/principal/interviews");
  return { success: true };
}

// Cancel interview
export async function cancelInterview(interviewId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const interview = await db.interview.update({
    where: { id: interviewId },
    data: { status: "CANCELLED" },
    include: { student: true, schoolTeacher: true },
  });

  // Revert status back to PENDING
  if (interview.studentId) {
    await db.student.update({
      where: { id: interview.studentId },
      data: { approvalStatus: "PENDING" },
    });
  }
  if (interview.schoolTeacherId) {
    await db.schoolTeacher.update({
      where: { id: interview.schoolTeacherId },
      data: { status: "PENDING" },
    });
  }

  revalidatePath("/principal/interviews");
  return { success: true };
}
