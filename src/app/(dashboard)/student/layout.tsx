import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";

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
  { href: "/student/certificates", icon: "Award", label: "Certificates" },
  { href: "/student/help", icon: "HelpCircle", label: "Help & FAQ" },
];

const limitedLinks = [
  { href: "/student", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/student/fees", icon: "CreditCard", label: "School Fees" },
  { href: "/student/profile", icon: "User", label: "My Profile" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/student/help", icon: "HelpCircle", label: "Help & FAQ" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  let links = fullLinks;

  try {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      include: { school: true, payments: true },
    });

    if (student && student.approvalStatus !== "APPROVED") {
      links = limitedLinks;
    } else if (student && !student.feePaid) {
      // Check fee percentage
      const policy = student.school.feePaymentPolicy || "PERCENTAGE";
      if (policy !== "FLEXIBLE") {
        const completedPayments = student.payments.filter((p: any) => p.status === "COMPLETED");
        const paidAmount = completedPayments.reduce((s: number, p: any) => s + p.amount, 0);

        let totalFees = 0;
        try {
          const sg = await db.schoolGrade.findFirst({
            where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
          });
          if (sg) {
            const fs = await db.feeStructure.findMany({ where: { schoolGradeId: sg.id, isActive: true } });
            totalFees = fs.reduce((s, f) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
          }
        } catch (_e) {}

        if (totalFees > 0) {
          const pct = Math.round((paidAmount / totalFees) * 100);
          const threshold = student.school.feePaymentThreshold ?? 70;
          const met = policy === "FULL" ? pct >= 100 : pct >= threshold;
          if (!met) links = limitedLinks;
        }
      }
    }
  } catch (e) {
    console.error("Layout access check error:", e);
    // Default to full links on error
  }

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
