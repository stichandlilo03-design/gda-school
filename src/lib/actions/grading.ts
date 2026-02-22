"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getGradeFromScore, generateEventsForYear } from "@/lib/academic-calendar";

// ============================================================
// TEACHER: Submit grades for principal approval
// ============================================================
export async function submitGradesForApproval(assessmentId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: { scores: true },
  });
  if (!assessment) return { error: "Assessment not found" };
  if (assessment.scores.length === 0) return { error: "Enter scores before submitting" };

  await db.assessment.update({
    where: { id: assessmentId },
    data: { gradeStatus: "SUBMITTED", submittedAt: new Date() },
  });

  revalidatePath("/teacher/gradebook");
  revalidatePath("/principal/grading");
  return { success: true };
}

// ============================================================
// PRINCIPAL: Approve / Reject grades
// ============================================================
export async function approveGrades(assessmentId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.assessment.update({
    where: { id: assessmentId },
    data: { gradeStatus: "APPROVED", approvedAt: new Date(), approvedBy: sess.user.id },
  });

  revalidatePath("/principal/grading");
  revalidatePath("/teacher/gradebook");
  return { success: true };
}

export async function rejectGrades(assessmentId: string, reason: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.assessment.update({
    where: { id: assessmentId },
    data: { gradeStatus: "REJECTED", rejectedReason: reason || "Needs revision" },
  });

  revalidatePath("/principal/grading");
  revalidatePath("/teacher/gradebook");
  return { success: true };
}

// ============================================================
// ASSIGNMENTS
// ============================================================
export async function createAssignment(data: {
  classId: string; title: string; description?: string; dueDate?: string; maxScore?: number;
  type?: string; questions?: any[];
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  // Calculate total points from questions
  const questions = data.questions || [];
  const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

  const assignment = await db.assignment.create({
    data: {
      classId: data.classId,
      title: data.title,
      description: data.description,
      type: data.type || "HOMEWORK",
      questions: questions.length > 0 ? questions : undefined,
      totalPoints,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      maxScore: data.maxScore || totalPoints || 100,
    },
  });

  // Send notification to all enrolled students in this class
  try {
    const enrollments = await db.enrollment.findMany({
      where: { classId: data.classId, status: "ACTIVE" },
      include: { student: { select: { userId: true } }, class: { select: { name: true } } },
    });
    const className = enrollments[0]?.class?.name || "your class";
    const dueStr = data.dueDate ? ` Due: ${new Date(data.dueDate).toLocaleDateString()}` : "";
    const studentUserIds = enrollments.map(e => e.student.userId);
    if (studentUserIds.length > 0) {
      const { notifyMany } = await import("@/lib/notifications");
      await notifyMany(
        studentUserIds,
        `📝 New ${data.type || "Homework"}: ${data.title}`,
        `Your teacher assigned "${data.title}" in ${className}.${dueStr} Check your Grades & Assignments page to complete it.`,
        sess.user.id
      );
    }
  } catch (_e) {
    // Notification failed, but assignment was created
  }

  revalidatePath("/teacher/gradebook");
  revalidatePath("/teacher/classes");
  revalidatePath("/student/grades");
  return { success: true, assignmentId: assignment.id };
}

export async function gradeAssignment(submissionId: string, score: number, feedback?: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.assignmentSubmission.update({
    where: { id: submissionId },
    data: { score, feedback, gradedAt: new Date() },
  });

  revalidatePath("/teacher/gradebook");
  return { success: true };
}

export async function submitAssignment(assignmentId: string, content?: string, fileBase64?: string, answers?: any[]) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "STUDENT") return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { userId: sess.user.id } });
  if (!student) return { error: "Student not found" };

  if (fileBase64 && fileBase64.length > 10 * 1024 * 1024) return { error: "File too large (max 5MB)" };

  // Auto-grade MCQ and math questions
  let autoScore: number | null = null;
  let gradedAnswers = answers || [];
  if (answers && answers.length > 0) {
    const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
    const questions = (assignment?.questions as any[]) || [];
    if (questions.length > 0) {
      let earned = 0;
      let totalAutoGradable = 0;
      gradedAnswers = answers.map((a: any) => {
        const q = questions.find((qq: any) => qq.id === a.questionId);
        if (!q) return a;
        const points = q.points || 1;
        if (q.type === "mcq") {
          totalAutoGradable += points;
          const isCorrect = String(a.answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          if (isCorrect) earned += points;
          return { ...a, isCorrect, points: isCorrect ? points : 0 };
        }
        if (q.type === "math") {
          totalAutoGradable += points;
          // Normalize math answers: remove spaces, compare numerically if possible
          const stuAns = String(a.answer).trim().replace(/\s+/g, "");
          const corAns = String(q.correctAnswer).trim().replace(/\s+/g, "");
          let isCorrect = stuAns.toLowerCase() === corAns.toLowerCase();
          // Try numeric comparison
          if (!isCorrect) {
            const stuNum = parseFloat(stuAns);
            const corNum = parseFloat(corAns);
            if (!isNaN(stuNum) && !isNaN(corNum)) {
              isCorrect = Math.abs(stuNum - corNum) < 0.001;
            }
          }
          if (isCorrect) earned += points;
          return { ...a, isCorrect, points: isCorrect ? points : 0 };
        }
        // Short answer / essay — needs manual grading
        return { ...a, isCorrect: null, points: null };
      });
      if (totalAutoGradable > 0) {
        autoScore = earned;
      }
    }
  }

  await db.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: { content, fileUrl: fileBase64, answers: gradedAnswers.length > 0 ? gradedAnswers : undefined, autoScore, submittedAt: new Date() },
    create: { assignmentId, studentId: student.id, content, fileUrl: fileBase64, answers: gradedAnswers.length > 0 ? gradedAnswers : undefined, autoScore },
  });

  revalidatePath("/student/grades");
  revalidatePath("/teacher/gradebook");
  return { success: true, autoScore };
}

// ============================================================
// TERM REPORTS - Auto-generate from all data
// ============================================================
export async function generateTermReports(termId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: sess.user.id } });
  if (!principal) return { error: "Not found" };

  const term = await db.term.findUnique({ where: { id: termId } });
  if (!term) return { error: "Term not found" };

  // Get all active students
  const students = await db.student.findMany({
    where: { schoolId: principal.schoolId, approvalStatus: "APPROVED" },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              subject: true,
              teacher: { include: { user: { select: { name: true } } } },
              assessments: {
                where: {
                  gradeStatus: "APPROVED",
                  OR: [
                    { termId },
                    { termId: null, createdAt: { gte: term.startDate, lte: term.endDate || new Date() } },
                  ],
                },
                include: { scores: true },
              },
              attendances: true,
              assignments: { include: { submissions: true } },
            },
          },
        },
      },
      attendances: { where: { date: { gte: term.startDate, lte: term.endDate } } },
    },
  });

  let generated = 0;

  for (const student of students) {
    // Check if report already exists
    const existing = await db.termReport.findUnique({
      where: { studentId_termId: { studentId: student.id, termId } },
    });
    if (existing?.status === "APPROVED") continue; // Don't overwrite approved reports

    // Calculate attendance rate
    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Calculate assignment completion rate across all classes
    let totalAssignments = 0;
    let submittedAssignments = 0;

    // Build subject reports
    const subjectReports: {
      classId: string; subjectName: string; teacherName: string;
      caScore: number; examScore: number; totalScore: number; grade: string;
    }[] = [];

    for (const enrollment of student.enrollments) {
      const cls = enrollment.class;

      // CA scores (CONTINUOUS_ASSESSMENT, MID_TERM_TEST, PROJECT)
      const caAssessments = cls.assessments.filter(
        (a: any) => a.type !== "END_OF_TERM_EXAM"
      );
      const examAssessments = cls.assessments.filter(
        (a: any) => a.type === "END_OF_TERM_EXAM"
      );

      // Calculate weighted CA average (out of 40)
      let caTotal = 0;
      let caWeight = 0;
      for (const a of caAssessments) {
        const score = a.scores.find((s: any) => s.studentId === student.id);
        if (score?.score != null) {
          const pct = (score.score / a.maxScore) * 100;
          caTotal += pct * a.weight;
          caWeight += a.weight;
        }
      }
      const caAvg = caWeight > 0 ? (caTotal / caWeight) * 0.4 : 0; // CA = 40%

      // Calculate exam average (out of 60)
      let examTotal = 0;
      let examWeight = 0;
      for (const a of examAssessments) {
        const score = a.scores.find((s: any) => s.studentId === student.id);
        if (score?.score != null) {
          const pct = (score.score / a.maxScore) * 100;
          examTotal += pct * a.weight;
          examWeight += a.weight;
        }
      }
      const examAvg = examWeight > 0 ? (examTotal / examWeight) * 0.6 : 0; // Exam = 60%

      const total = Math.round(caAvg + examAvg);

      // Assignment tracking
      const classAssignments = cls.assignments || [];
      totalAssignments += classAssignments.length;
      for (const a of classAssignments) {
        if (a.submissions.some((s: any) => s.studentId === student.id)) {
          submittedAssignments++;
        }
      }

      subjectReports.push({
        classId: cls.id,
        subjectName: cls.subject?.name || cls.name,
        teacherName: cls.teacher?.user?.name || "Unknown",
        caScore: Math.round(caAvg * 100) / 100,
        examScore: Math.round(examAvg * 100) / 100,
        totalScore: total,
        grade: getGradeFromScore(total),
      });
    }

    const assignmentRate = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 100;

    // Merge duplicate subjects (e.g. two Mathematics classes → one report line)
    const mergedReports: typeof subjectReports = [];
    for (const sr of subjectReports) {
      const existing = mergedReports.find((r: any) => r.subjectName === sr.subjectName);
      if (existing) {
        // Average the scores from both classes
        existing.caScore = Math.round(((existing.caScore + sr.caScore) / 2) * 100) / 100;
        existing.examScore = Math.round(((existing.examScore + sr.examScore) / 2) * 100) / 100;
        existing.totalScore = Math.round(existing.caScore + existing.examScore);
        existing.grade = getGradeFromScore(existing.totalScore);
      } else {
        mergedReports.push({ ...sr });
      }
    }

    const overallAvg = mergedReports.length > 0
      ? Math.round(mergedReports.reduce((s: number, r: any) => s + r.totalScore, 0) / mergedReports.length)
      : 0;

    // Participation score (based on attendance + assignment completion)
    const participationScore = Math.round((attendanceRate * 0.5) + (assignmentRate * 0.5));

    // Upsert term report
    const report = await db.termReport.upsert({
      where: { studentId_termId: { studentId: student.id, termId } },
      update: {
        gradeLevel: student.gradeLevel,
        attendanceRate,
        assignmentRate,
        participationScore,
        overallAverage: overallAvg,
        status: "DRAFT",
      },
      create: {
        studentId: student.id,
        schoolId: principal.schoolId,
        termId,
        gradeLevel: student.gradeLevel,
        attendanceRate,
        assignmentRate,
        participationScore,
        overallAverage: overallAvg,
        status: "DRAFT",
      },
    });

    // Delete old subject reports and create new ones
    await db.subjectReport.deleteMany({ where: { termReportId: report.id } });
    for (const sr of mergedReports) {
      await db.subjectReport.create({
        data: {
          termReportId: report.id,
          classId: sr.classId,
          subjectName: sr.subjectName,
          teacherName: sr.teacherName,
          caScore: sr.caScore,
          examScore: sr.examScore,
          totalScore: sr.totalScore,
          grade: sr.grade,
        },
      });
    }

    generated++;
  }

  revalidatePath("/principal/grading");
  return { success: true, generated };
}

// ============================================================
// PRINCIPAL: Approve/Sign term report
// ============================================================
export async function approveTermReport(reportId: string, remarks?: string, promote?: boolean, nextGrade?: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.termReport.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: sess.user.id,
      principalRemarks: remarks,
      isPromoted: promote ?? null,
      nextGrade: nextGrade ?? null,
    },
  });

  // If promoted, actually change the student's grade
  if (promote && nextGrade) {
    const report = await db.termReport.findUnique({ where: { id: reportId } });
    if (report) {
      await db.student.update({
        where: { id: report.studentId },
        data: { gradeLevel: nextGrade as any },
      });
    }
  }

  revalidatePath("/principal/grading");
  return { success: true };
}

export async function rejectTermReport(reportId: string, reason: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.termReport.update({
    where: { id: reportId },
    data: { status: "REJECTED", principalRemarks: reason },
  });

  revalidatePath("/principal/grading");
  return { success: true };
}

// Teacher adds remarks to student's report
export async function addTeacherRemarks(reportId: string, remarks: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.termReport.update({
    where: { id: reportId },
    data: { teacherRemarks: remarks, status: "SUBMITTED", submittedAt: new Date() },
  });

  revalidatePath("/teacher/gradebook");
  revalidatePath("/principal/grading");
  return { success: true };
}

// ============================================================
// ACADEMIC CALENDAR MANAGEMENT
// ============================================================
export async function generateAcademicCalendar(year: number) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({
    where: { userId: sess.user.id },
    include: { school: { select: { id: true, countryCode: true } } },
  });
  if (!principal) return { error: "Not found" };

  const events = generateEventsForYear(principal.school.countryCode, year);

  // Delete existing auto-generated events for this school
  await db.academicEvent.deleteMany({
    where: { schoolId: principal.schoolId, isAutoGenerated: true },
  });

  // Create all events
  for (const evt of events) {
    await db.academicEvent.create({
      data: {
        schoolId: principal.schoolId,
        title: evt.title,
        eventType: evt.eventType as any,
        startDate: evt.startDate,
        endDate: evt.endDate,
        termNumber: evt.termNumber as any,
        isAutoGenerated: true,
      },
    });
  }

  // Also auto-create Term records
  const template = (await import("@/lib/academic-calendar")).getCalendarTemplate(principal.school.countryCode);
  for (const t of template.terms) {
    const startYear = t.startMonth >= 8 ? year : year + 1;
    const endYear = t.endMonth <= t.startMonth && t.startMonth >= 8 ? year + 1 : startYear;
    const start = new Date(startYear, t.startMonth - 1, t.startDay);
    const end = new Date(endYear, t.endMonth - 1, t.endDay);

    const existing = await db.term.findFirst({
      where: { schoolId: principal.schoolId, termNumber: t.termNumber as any, startDate: start },
    });
    if (!existing) {
      await db.term.create({
        data: {
          schoolId: principal.schoolId,
          termNumber: t.termNumber as any,
          name: t.name,
          startDate: start,
          endDate: end,
          isActive: false,
        },
      });
    }
  }

  revalidatePath("/principal/calendar");
  revalidatePath("/principal/grading");
  return { success: true, count: events.length };
}

export async function addCustomEvent(data: {
  title: string; description?: string; eventType: string; startDate: string; endDate: string;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: sess.user.id } });
  if (!principal) return { error: "Not found" };

  await db.academicEvent.create({
    data: {
      schoolId: principal.schoolId,
      title: data.title,
      description: data.description,
      eventType: data.eventType as any,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isAutoGenerated: false,
    },
  });

  revalidatePath("/principal/calendar");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.academicEvent.delete({ where: { id: eventId } });
  revalidatePath("/principal/calendar");
  return { success: true };
}

export async function setActiveTerm(termId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: sess.user.id } });
  if (!principal) return { error: "Not found" };

  // Deactivate all terms for this school
  await db.term.updateMany({
    where: { schoolId: principal.schoolId },
    data: { isActive: false },
  });

  // Activate the selected term
  await db.term.update({ where: { id: termId }, data: { isActive: true } });

  revalidatePath("/principal/calendar");
  revalidatePath("/principal/grading");
  return { success: true };
}
