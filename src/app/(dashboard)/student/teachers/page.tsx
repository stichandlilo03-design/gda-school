import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherBrowser from "./teacher-browser";

export default async function StudentTeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { select: { id: true, subjectId: true, teacherId: true } } },
      },
    },
  });
  if (!student) return null;

  // All classes for this grade
  const availableClasses = await db.class.findMany({
    where: {
      schoolGrade: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
      isActive: true,
    },
    include: {
      teacher: {
        select: { id: true, bio: true, headline: true, profilePicture: true, introVideoUrl: true, rating: true, totalRatings: true, isVerified: true, isOnline: true, lastSeenAt: true, profileSlug: true, yearsExperience: true, teachingStyle: true, subjects: true, user: { select: { name: true, image: true, email: true } } },
      },
      subject: true,
      enrollments: { where: { status: "ACTIVE" } },
      schoolGrade: true,
      schedules: true,
    },
    orderBy: { teacher: { rating: "desc" } },
  });

  // Build teacher profiles with all their subjects
  const teacherMap = new Map<string, any>();
  availableClasses.forEach((cls) => {
    if (!teacherMap.has(cls.teacherId)) {
      teacherMap.set(cls.teacherId, {
        id: cls.teacherId,
        name: cls.teacher.user.name,
        image: cls.teacher.user.image || cls.teacher.profilePicture,
        email: cls.teacher.user.email,
        rating: cls.teacher.rating,
        totalRatings: cls.teacher.totalRatings,
        years: cls.teacher.yearsExperience,
        style: cls.teacher.teachingStyle,
        bio: cls.teacher.bio,
        headline: cls.teacher.headline,
        isOnline: cls.teacher.isOnline,
        lastSeenAt: cls.teacher.lastSeenAt,
        profileSlug: cls.teacher.profileSlug,
        introVideoUrl: cls.teacher.introVideoUrl,
        isVerified: cls.teacher.isVerified,
        subjects: [],
        classes: [],
      });
    }
    const t = teacherMap.get(cls.teacherId)!;
    if (!t.subjects.includes(cls.subject.name)) t.subjects.push(cls.subject.name);
    t.classes.push({
      id: cls.id,
      name: cls.name,
      subjectName: cls.subject.name,
      subjectId: cls.subjectId,
      session: cls.session,
      enrolled: cls.enrollments.length,
      max: cls.maxStudents,
      schedules: cls.schedules.map((s: any) => ({ day: s.dayOfWeek, start: s.startTime, end: s.endTime })),
    });
  });

  const enrolledClassIds = new Set(student.enrollments.map((e) => e.classId));
  const enrolledSubjectIds = new Set(student.enrollments.map((e) => e.class.subjectId));

  return (
    <>
      <DashboardHeader
        title="Choose Your Teachers"
        subtitle={`${teacherMap.size} teachers available for ${student.gradeLevel}`}
      />
      <div className="p-6 lg:p-8">
        <TeacherBrowser
          teachers={JSON.parse(JSON.stringify(Array.from(teacherMap.values())))}
          enrolledClassIds={JSON.parse(JSON.stringify(Array.from(enrolledClassIds)))}
          enrolledSubjectIds={JSON.parse(JSON.stringify(Array.from(enrolledSubjectIds)))}
          studentId={student.id}
        />
      </div>
    </>
  );
}
