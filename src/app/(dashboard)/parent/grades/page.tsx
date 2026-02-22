import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ParentGradesClient from "./parent-grades-client";

export default async function ParentGradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let childrenData: any[] = [];
  let queryError = "";

  try {
    const parent = await db.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: { select: { name: true, image: true } },
                school: { select: { name: true, countryCode: true } },
                scores: {
                  where: { assessment: { gradeStatus: "APPROVED" } },
                  include: { assessment: { include: { class: { include: { subject: true } } } } },
                  orderBy: { createdAt: "desc" },
                },
                termReports: {
                  where: { status: "APPROVED" },
                  include: { term: true, subjectReports: true },
                  orderBy: { createdAt: "desc" },
                },
                assignmentSubmissions: {
                  include: { assignment: { include: { class: { select: { id: true, name: true, subject: { select: { name: true } } } } } } },
                  orderBy: { submittedAt: "desc" },
                },
                enrollments: {
                  where: { status: "ACTIVE" },
                  include: {
                    class: {
                      include: {
                        subject: true,
                        assignments: { where: { isActive: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) return <div className="p-8">Not found.</div>;

    childrenData = parent.children.map((link: any) => {
      const child = link.student;
      const allAssignments = child.enrollments.flatMap((e: any) =>
        (e.class.assignments || []).map((a: any) => ({
          ...a,
          className: e.class.subject?.name || e.class.name,
          submitted: child.assignmentSubmissions.some((s: any) => s.assignmentId === a.id),
          submission: child.assignmentSubmissions.find((s: any) => s.assignmentId === a.id),
        }))
      );

      return {
        id: child.id,
        name: child.user.name,
        image: child.user.image,
        school: child.school.name,
        countryCode: child.school.countryCode,
        gradeLevel: child.gradeLevel,
        relationship: link.relation,
        scores: child.scores,
        termReports: child.termReports,
        assignments: allAssignments,
        submissions: child.assignmentSubmissions,
      };
    });
  } catch (err: any) {
    queryError = err?.message || "Unknown error";
    console.error("Parent grades error:", queryError);
  }

  return (
    <>
      <DashboardHeader title="Grades & Reports" subtitle="Verified academic records — approved by school principal" />
      <div className="p-6 lg:p-8">
        {queryError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-bold">⚠️ Error loading grades</p>
            <p className="text-xs mt-1 text-red-500">{queryError}</p>
            <a href="/parent/grades" className="text-xs underline mt-2 inline-block">Try Again</a>
          </div>
        )}
        <ParentGradesClient children={JSON.parse(JSON.stringify(childrenData))} />
      </div>
    </>
  );
}
