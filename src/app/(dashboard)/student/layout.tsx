import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkStudentAccess } from "@/lib/student-access";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";

// Stage 1: Not approved yet (PENDING, INTERVIEW_SCHEDULED, INTERVIEWED, REJECTED)
const pendingLinks = [
  { href: "/student", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/student/profile", icon: "User", label: "My Profile" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/student/help", icon: "HelpCircle", label: "Help & FAQ" },
];

// Stage 2: Approved but fees not paid
const awaitingPaymentLinks = [
  { href: "/student", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/student/fees", icon: "CreditCard", label: "School Fees" },
  { href: "/student/profile", icon: "User", label: "My Profile" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/student/help", icon: "HelpCircle", label: "Help & FAQ" },
];

// Stage 3: Fully enrolled — approved + fees paid
const fullLinks = [
  { href: "/student", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/student/classroom", icon: "Play", label: "My Classroom" },
  { href: "/student/subjects", icon: "BookOpen", label: "My Subjects" },
  { href: "/student/teachers", icon: "Users", label: "Browse Teachers" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/student/timetable", icon: "Calendar", label: "Timetable" },
  { href: "/student/calendar", icon: "Calendar", label: "Academic Calendar" },
  { href: "/student/grades", icon: "ClipboardList", label: "Grades & Assignments" },
  { href: "/student/attendance", icon: "UserCheck", label: "Attendance" },
  { href: "/student/materials", icon: "FolderOpen", label: "Materials" },
  { href: "/student/fees", icon: "CreditCard", label: "School Fees" },
  { href: "/student/profile", icon: "User", label: "Profile & ID Card" },
  { href: "/student/school-info", icon: "Flag", label: "School Info" },
  { href: "/student/games", icon: "Gamepad2", label: "Games & Fun" },
  { href: "/student/certificates", icon: "Award", label: "Certificates" },
  { href: "/student/help", icon: "HelpCircle", label: "Help & FAQ" },
];

// Stage 4: During live class — locked to classroom
const inClassLinks = [
  { href: "/student/classroom", icon: "Play", label: "My Classroom" },
  { href: "/student/grades", icon: "ClipboardList", label: "My Desk / Homework" },
  { href: "/student/materials", icon: "FolderOpen", label: "Class Materials" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  let links = fullLinks;
  try {
    const access = await checkStudentAccess(session.user.id);
    if (!access) {
      links = pendingLinks;
    } else if (!access.isApproved) {
      // Not yet approved (PENDING / INTERVIEW_SCHEDULED / INTERVIEWED / REJECTED)
      links = pendingLinks;
    } else if (!access.feesMet) {
      // Approved but hasn't met the school's fee payment threshold
      links = awaitingPaymentLinks;
    } else {
      // Fully enrolled — check if in active class
      const student = await db.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (student) {
        const activeSession = await db.liveClassSession.findFirst({
          where: {
            status: "IN_PROGRESS",
            class: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } },
          },
          select: { id: true },
        });
        if (activeSession) links = inClassLinks;
      }
    }
  } catch (_e) {}

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar
        user={{ name: session.user.name, email: session.user.email, role: session.user.role, image: session.user.image || undefined }}
        links={links}
      />
      <main className="lg:ml-64">{children}</main>
    </div>
  );
}
