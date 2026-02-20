"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notify, notifyMany } from "@/lib/notifications";

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

// Approve applicant after interview — assign to school + create class for the vacancy grade
export async function approveAndAssignToGrade(appId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: sess.user.id }, include: { school: true } });
  if (!principal) return { error: "Principal not found" };

  const app = await db.vacancyApplication.update({
    where: { id: appId },
    data: { status: "ACCEPTED" },
    include: { vacancy: true },
  });

  if (!app.teacherId) return { error: "This applicant is not a registered teacher on the platform. Accept manually." };

  // Add teacher to school
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

  // If vacancy has a grade level, find/create the school grade and create a class
  if (app.vacancy.gradeLevel) {
    let schoolGrade = await db.schoolGrade.findFirst({
      where: { schoolId: app.vacancy.schoolId, gradeLevel: app.vacancy.gradeLevel },
    });
    if (!schoolGrade) {
      schoolGrade = await db.schoolGrade.create({
        data: { schoolId: app.vacancy.schoolId, gradeLevel: app.vacancy.gradeLevel },
      });
    }

    // Parse subjects from vacancy
    const subjects = Array.isArray(app.vacancy.subjects) ? app.vacancy.subjects as string[] : [];
    
    // If no subjects specified, create a general class from vacancy title
    if (subjects.length === 0) {
      const existingClass = await db.class.findFirst({
        where: { teacherId: app.teacherId!, schoolGradeId: schoolGrade.id },
      });
      if (!existingClass) {
        await db.class.create({
          data: {
            teacherId: app.teacherId!,
            schoolGradeId: schoolGrade.id,
            name: `${app.vacancy.title} - ${app.vacancy.gradeLevel}`,
            session: app.vacancy.session || "SESSION_A",
            maxStudents: 40,
          },
        });
      }
    }
    
    for (const subjectName of subjects) {
      if (!subjectName) continue;
      // Find or create subject
      let subject = await db.subject.findFirst({ where: { name: subjectName } });
      if (!subject) {
        const code = subjectName.slice(0, 3).toUpperCase().replace(/\s/g, "");
        subject = await db.subject.upsert({
          where: { code },
          update: {},
          create: { name: subjectName, code },
        });
      }

      // Ensure GradeSubject link
      await db.gradeSubject.upsert({
        where: { schoolGradeId_subjectId: { schoolGradeId: schoolGrade.id, subjectId: subject.id } },
        update: {},
        create: { schoolGradeId: schoolGrade.id, subjectId: subject.id },
      });

      // Create class for the teacher
      const existingClass = await db.class.findFirst({
        where: { teacherId: app.teacherId!, schoolGradeId: schoolGrade.id, subjectId: subject.id },
      });
      if (!existingClass) {
        await db.class.create({
          data: {
            teacherId: app.teacherId!,
            schoolGradeId: schoolGrade.id,
            subjectId: subject.id,
            name: `${subjectName} - ${app.vacancy.gradeLevel}`,
            session: app.vacancy.session || "SESSION_A",
            maxStudents: 40,
          },
        });
      }
    }
  }

  // Close vacancy if needed
  const remaining = await db.vacancyApplication.count({
    where: { vacancyId: app.vacancyId, status: { in: ["APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED"] } },
  });
  if (remaining === 0) {
    await db.vacancy.update({ where: { id: app.vacancyId }, data: { status: "FILLED" } });
  }

  revalidatePath("/principal/vacancies");
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/curriculum");
  revalidatePath("/teacher");
  revalidatePath("/student/classroom");
  revalidatePath("/student/subjects");

  // Notify the teacher
  if (app.teacherId) {
    const teacher = await db.teacher.findUnique({ where: { id: app.teacherId }, select: { userId: true } });
    if (teacher) {
      const subjectList = Array.isArray(app.vacancy.subjects) ? (app.vacancy.subjects as string[]).join(", ") : "subjects";
      await notify(
        teacher.userId,
        "🎉 Application Approved!",
        `Congratulations! Your application for "${app.vacancy.title}" has been approved by ${principal.school.name}. ` +
        `You have been assigned to teach ${subjectList}${app.vacancy.gradeLevel ? ` for ${app.vacancy.gradeLevel}` : ""}. ` +
        `Your classes have been created automatically. Go to your Classroom to start teaching!`
      );
    }

    // Notify students in that grade about new teacher
    if (app.vacancy.gradeLevel) {
      const studentsInGrade = await db.student.findMany({
        where: { schoolId: app.vacancy.schoolId, gradeLevel: app.vacancy.gradeLevel as any, approvalStatus: "APPROVED" },
        select: { userId: true },
      });
      if (studentsInGrade.length > 0) {
        await notifyMany(
          studentsInGrade.map(s => s.userId),
          "📚 New Teacher Assigned!",
          `A new teacher has been assigned to your grade (${app.vacancy.gradeLevel}) for ${subjectList}. Check your Subjects page to enroll!`
        );
      }
    }
  }

  return { success: true, message: "Teacher approved, assigned to school, and classes created!" };
}
