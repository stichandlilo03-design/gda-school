import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import { db } from "@/lib/db";

const principalLinks = [
  { href: "/principal", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/principal/monitor", icon: "Monitor", label: "Classroom Monitor" },
  { href: "/principal/teachers", icon: "Users", label: "Teachers" },
  { href: "/principal/students", icon: "GraduationCap", label: "Students" },
  { href: "/principal/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/principal/interviews", icon: "Calendar", label: "Interviews" },
  { href: "/principal/vacancies", icon: "Briefcase", label: "Vacancies" },
  { href: "/principal/payroll", icon: "DollarSign", label: "Payroll" },
  { href: "/principal/fees", icon: "CreditCard", label: "Fee Structure" },
  { href: "/principal/bank-accounts", icon: "Building2", label: "Bank Accounts" },
  { href: "/principal/payments", icon: "DollarSign", label: "Payment Review" },
  { href: "/principal/curriculum", icon: "BookOpen", label: "Curriculum" },
  { href: "/principal/timetable", icon: "Calendar", label: "Timetable" },
  { href: "/principal/calendar", icon: "Calendar", label: "Academic Calendar" },
  { href: "/principal/grading", icon: "ClipboardList", label: "Grading & Reports" },
  { href: "/principal/reports", icon: "BarChart3", label: "Reports" },
  { href: "/principal/settings", icon: "Settings", label: "School Settings" },
  { href: "/principal/help", icon: "HelpCircle", label: "Help & FAQ" },
];

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "PRINCIPAL") redirect("/login");

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar
        user={{ name: session.user.name, email: session.user.email, role: session.user.role, image: session.user.image || undefined }}
        links={principalLinks}
        schoolName={principal?.school.name}
      />
      <main className="lg:ml-64">{children}</main>
    </div>
  );
}
