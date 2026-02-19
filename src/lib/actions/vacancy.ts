"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Create a vacancy
export async function createVacancy(data: {
  title: string;
  description: string;
  requirements: string[];
  subjects: string[];
  gradeLevel?: string;
  session?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType: string;
  deadline?: string;
  maxApplicants: number;
  isPublic: boolean;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: sess.user.id }, include: { school: true } });
  if (!principal) return { error: "Principal not found" };

  await db.vacancy.create({
    data: {
      schoolId: principal.schoolId,
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      subjects: data.subjects,
      gradeLevel: data.gradeLevel as any || null,
      session: data.session as any || null,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      currency: principal.school.currency,
      employmentType: data.employmentType,
      deadline: data.deadline ? new Date(data.deadline) : null,
      maxApplicants: data.maxApplicants,
      isPublic: data.isPublic,
      status: "OPEN",
    },
  });

  revalidatePath("/principal/vacancies");
  return { success: true };
}

// Close a vacancy
export async function closeVacancy(vacancyId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.vacancy.update({ where: { id: vacancyId }, data: { status: "CLOSED" } });
  revalidatePath("/principal/vacancies");
  return { success: true };
}

// Reopen a vacancy
export async function reopenVacancy(vacancyId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.vacancy.update({ where: { id: vacancyId }, data: { status: "OPEN" } });
  revalidatePath("/principal/vacancies");
  return { success: true };
}

// Apply to a vacancy (public or logged-in teacher)
export async function applyToVacancy(data: {
  vacancyId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverLetter?: string;
  resumeUrl?: string;
  experience: number;
  qualifications: string[];
}) {
  const sess = await getServerSession(authOptions);
  let teacherId: string | undefined;

  if (sess?.user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: sess.user.id } });
    if (teacher) {
      teacherId = teacher.id;
      const existing = await db.vacancyApplication.findFirst({
        where: { vacancyId: data.vacancyId, teacherId: teacher.id },
      });
      if (existing) return { error: "You have already applied to this vacancy." };
    }
  }

  const vacancy = await db.vacancy.findUnique({
    where: { id: data.vacancyId },
    include: { _count: { select: { applications: true } } },
  });
  if (!vacancy || vacancy.status !== "OPEN") return { error: "Vacancy is no longer open." };
  if (vacancy._count.applications >= vacancy.maxApplicants) return { error: "Maximum applicants reached." };

  await db.vacancyApplication.create({
    data: {
      vacancyId: data.vacancyId,
      teacherId: teacherId || null,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantPhone: data.applicantPhone,
      coverLetter: data.coverLetter,
      resumeUrl: data.resumeUrl,
      experience: data.experience,
      qualifications: data.qualifications,
      status: "APPLIED",
    },
  });

  revalidatePath("/principal/vacancies");
  return { success: true, message: "Application submitted! The school will review your application." };
}

// Shortlist an applicant
export async function shortlistApplicant(appId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.vacancyApplication.update({ where: { id: appId }, data: { status: "SHORTLISTED" } });
  revalidatePath("/principal/vacancies");
  return { success: true };
}

// Accept an applicant (hire)
export async function acceptApplicant(appId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const app = await db.vacancyApplication.update({
    where: { id: appId },
    data: { status: "ACCEPTED" },
    include: { vacancy: true },
  });

  // If the applicant is a registered teacher, add them to the school
  if (app.teacherId) {
    const existing = await db.schoolTeacher.findUnique({
      where: { teacherId_schoolId: { teacherId: app.teacherId, schoolId: app.vacancy.schoolId } },
    });
    if (!existing) {
      await db.schoolTeacher.create({
        data: { teacherId: app.teacherId, schoolId: app.vacancy.schoolId, status: "APPROVED", isActive: true, requestedBy: "PRINCIPAL" },
      });
    } else {
      await db.schoolTeacher.update({ where: { id: existing.id }, data: { status: "APPROVED", isActive: true } });
    }
  }

  revalidatePath("/principal/vacancies");
  revalidatePath("/principal/teachers");
  return { success: true };
}

// Reject an applicant
export async function rejectApplicant(appId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.vacancyApplication.update({ where: { id: appId }, data: { status: "REJECTED" } });
  revalidatePath("/principal/vacancies");
  return { success: true };
}
