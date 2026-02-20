import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";

const parentLinks = [
  { href: "/parent", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/parent/children", icon: "Users", label: "My Children" },
  { href: "/parent/attendance", icon: "UserCheck", label: "Attendance" },
  { href: "/parent/grades", icon: "ClipboardList", label: "Grades & Reports" },
  { href: "/parent/fees", icon: "CreditCard", label: "Fees & Payments" },
  { href: "/parent/teachers", icon: "BookOpen", label: "Teachers" },
  { href: "/parent/timetable", icon: "Calendar", label: "Timetable" },
  { href: "/parent/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/parent/profile", icon: "User", label: "My Profile" },
  { href: "/parent/help", icon: "HelpCircle", label: "Help & FAQ" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar
        user={{ name: session.user.name, email: session.user.email, role: session.user.role, image: session.user.image || undefined }}
        links={parentLinks}
      />
      <main className="lg:ml-64">{children}</main>
    </div>
  );
}
