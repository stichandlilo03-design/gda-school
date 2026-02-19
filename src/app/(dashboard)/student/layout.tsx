import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";

const studentLinks = [
  { href: "/student", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/student/teachers", icon: "BookOpen", label: "Browse Classes" },
  { href: "/student/schedule", icon: "Calendar", label: "My Schedule" },
  { href: "/student/grades", icon: "BarChart3", label: "My Grades" },
  { href: "/student/attendance", icon: "UserCheck", label: "Attendance" },
  { href: "/student/materials", icon: "FolderOpen", label: "Materials" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/student/fees", icon: "CreditCard", label: "School Fees" },
  { href: "/student/certificates", icon: "Award", label: "Certificates" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar
        user={{ name: session.user.name, email: session.user.email, role: session.user.role, image: session.user.image || undefined }}
        links={studentLinks}
      />
      <main className="lg:ml-64">{children}</main>
    </div>
  );
}
