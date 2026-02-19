import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";

const teacherLinks = [
  { href: "/teacher", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/teacher/classes", icon: "BookOpen", label: "My Classes" },
  { href: "/teacher/students", icon: "Users", label: "Students" },
  { href: "/teacher/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/teacher/gradebook", icon: "ClipboardList", label: "Gradebook" },
  { href: "/teacher/attendance", icon: "UserCheck", label: "Attendance" },
  { href: "/teacher/materials", icon: "FolderOpen", label: "Materials" },
  { href: "/teacher/schedule", icon: "Clock", label: "Schedule" },
  { href: "/teacher/payroll", icon: "DollarSign", label: "My Payroll" },
  { href: "/teacher/vacancies", icon: "Briefcase", label: "Job Board" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "TEACHER") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar
        user={{ name: session.user.name, email: session.user.email, role: session.user.role, image: session.user.image || undefined }}
        links={teacherLinks}
      />
      <main className="lg:ml-64">{children}</main>
    </div>
  );
}
