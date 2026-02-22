"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================
// CLASS MANAGEMENT
// ============================================================
export async function createClass(data: {
  name: string;
  description?: string;
  schoolGradeId: string;
  session: string;
  maxStudents: number;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: sess.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  const cls = await db.class.create({
    data: {
      teacherId: teacher.id,
      schoolGradeId: data.schoolGradeId,
      subjectId: "default",
      name: data.name,
      description: data.description,
      session: data.session as any,
      maxStudents: data.maxStudents,
    },
  });

  revalidatePath("/teacher/classes");
  return { success: true, classId: cls.id };
}

export async function deleteClass(classId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.class.update({ where: { id: classId }, data: { isActive: false } });
  revalidatePath("/teacher/classes");
  return { success: true };
}

// ============================================================
// ATTENDANCE
// ============================================================
export async function markAttendance(data: {
  classId: string;
  date: string;
  session: string;
  records: { studentId: string; status: string }[];
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const dateObj = new Date(data.date);

  for (const record of data.records) {
    await db.attendanceRecord.upsert({
      where: {
        studentId_classId_date_session: {
          studentId: record.studentId,
          classId: data.classId,
          date: dateObj,
          session: data.session as any,
        },
      },
      update: {
        status: record.status as any,
        markedBy: sess.user.id,
        joinedAt: record.status === "PRESENT" || record.status === "LATE" ? new Date() : null,
      },
      create: {
        studentId: record.studentId,
        classId: data.classId,
        date: dateObj,
        session: data.session as any,
        status: record.status as any,
        markedBy: sess.user.id,
        joinedAt: record.status === "PRESENT" || record.status === "LATE" ? new Date() : null,
      },
    });
  }

  revalidatePath("/teacher/attendance");
  return { success: true };
}

// ============================================================
// GRADEBOOK / ASSESSMENTS
// ============================================================
export async function createAssessment(data: {
  classId: string;
  type: string;
  title: string;
  description?: string;
  maxScore: number;
  weight: number;
  dueDate?: string;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const assessment = await db.assessment.create({
    data: {
      classId: data.classId,
      type: data.type as any,
      title: data.title,
      description: data.description,
      maxScore: data.maxScore,
      weight: data.weight,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      termId: await (async () => {
        try {
          const cls = await db.class.findUnique({ where: { id: data.classId }, select: { schoolGrade: { select: { schoolId: true } } } });
          if (cls?.schoolGrade?.schoolId) {
            const activeTerm = await db.term.findFirst({ where: { schoolId: cls.schoolGrade.schoolId, isActive: true } });
            return activeTerm?.id || null;
          }
          return null;
        } catch { return null; }
      })(),
      isPublished: true,
      gradeStatus: "DRAFT",
    },
  });

  revalidatePath("/teacher/gradebook");
  revalidatePath("/principal/grading");
  revalidatePath("/student/grades");
  return { success: true, assessmentId: assessment.id };
}

export async function enterScores(data: {
  assessmentId: string;
  scores: { studentId: string; score: number; feedback?: string }[];
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  for (const s of data.scores) {
    await db.score.upsert({
      where: {
        studentId_assessmentId: {
          studentId: s.studentId,
          assessmentId: data.assessmentId,
        },
      },
      update: { score: s.score, feedback: s.feedback, gradedAt: new Date() },
      create: {
        studentId: s.studentId,
        assessmentId: data.assessmentId,
        score: s.score,
        feedback: s.feedback,
        gradedAt: new Date(),
      },
    });
  }

  revalidatePath("/teacher/gradebook");
  revalidatePath("/principal/grading");
  revalidatePath("/student/grades");
  return { success: true };
}

export async function deleteAssessment(assessmentId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.score.deleteMany({ where: { assessmentId } });
  await db.assessment.delete({ where: { id: assessmentId } });
  revalidatePath("/teacher/gradebook");
  revalidatePath("/principal/grading");
  revalidatePath("/student/grades");
  return { success: true };
}

// ============================================================
// MATERIALS
// ============================================================
export async function addMaterial(data: {
  classId: string;
  title: string;
  description?: string;
  type: string;
  url: string;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: sess.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  await db.classMaterial.create({
    data: {
      classId: data.classId,
      teacherId: teacher.id,
      title: data.title,
      description: data.description,
      type: data.type as any,
      url: data.url,
    },
  });

  revalidatePath("/teacher/materials");
  return { success: true };
}

export async function deleteMaterial(materialId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.classMaterial.delete({ where: { id: materialId } });
  revalidatePath("/teacher/materials");
  return { success: true };
}
