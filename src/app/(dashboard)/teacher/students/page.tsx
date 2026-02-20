import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Users, BookOpen } from "lucide-react";

export default async function TeacherStudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: { include: { user: { select: { name: true, email: true } } } } },
          },
          schoolGrade: true,
        },
      },
    },
  });

  const allStudents = new Map<string, { student: any; classes: string[] }>();
  teacher?.classes.forEach((c) => {
    c.enrollments.forEach((e) => {
      if (allStudents.has(e.student.id)) {
        allStudents.get(e.student.id)!.classes.push(c.name);
      } else {
        allStudents.set(e.student.id, { student: e.student, classes: [c.name] });
      }
    });
  });

  return (
    <>
      <DashboardHeader title="My Students" subtitle={`${allStudents.size} student(s) across all classes`} />
      <div className="p-6 lg:p-8">
        {allStudents.size === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students enrolled yet. Students will appear here once they enroll in your classes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(allStudents.values()).map(({ student, classes }) => (
              <div key={student.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{student.user.name}</p>
                  <p className="text-xs text-gray-500">{student.user.email} • {student.gradeLevel}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {classes.map((c, i) => (
                    <span key={i} className="badge-info text-[10px]">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
