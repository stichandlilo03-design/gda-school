import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import {
  LayoutDashboard, BookOpen, Users, Calendar, Award, FolderOpen, BookMarked,
  ClipboardList, MessageSquare, Settings, UserCircle,
} from "lucide-react";

const studentLinks = [
  { href: "/student", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/classroom", icon: BookOpen, label: "My Classroom" },
  { href: "/student/subjects", icon: BookMarked, label: "My Subjects" },
  { href: "/student/teachers", icon: Users, label: "My Teachers" },
  { href: "/student/timetable", icon: Calendar, label: "Timetable" },
  { href: "/student/grades", icon: ClipboardList, label: "My Grades" },
  { href: "/student/certificates", icon: Award, label: "Certificates" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          image: session.user.image || undefined,
        }}
        links={studentLinks}
      />
      <main className="lg:ml-64">
        {children}
      </main>
    </div>
  );
}
