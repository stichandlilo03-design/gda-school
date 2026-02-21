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

// Limited sidebar for unapproved / unpaid students
const limitedLinks = [
  { href: "/student", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/student/fees", icon: "CreditCard", label: "School Fees" },
  { href: "/student/profile", icon: "User", label: "My Profile" },
  { href: "/student/messages", icon: "MessageSquare", label: "Messages" },
  { href: "/student/help", icon: "HelpCircle", label: "Help & FAQ" },
];

// Pages allowed for unapproved students
const ALLOWED_PATHS = ["/student", "/student/fees", "/student/profile", "/student/messages", "/student/help"];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  // Fetch student enrollment status
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: {
      approvalStatus: true,
      feePaid: true,
      schoolId: true,
      gradeLevel: true,
      school: { select: { feePaymentThreshold: true, feePaymentPolicy: true } },
      payments: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  });

  // Calculate if student has full access
  let isFullyEnrolled = false;
  if (student) {
    const isApproved = student.approvalStatus === "APPROVED";

    // Fee check
    let feesMet = student.feePaid;
    if (!feesMet && student.school.feePaymentPolicy === "FLEXIBLE") {
      feesMet = true; // Flexible = always access
    }
    if (!feesMet) {
      const schoolGrade = await db.schoolGrade.findFirst({
        where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
      });
      if (schoolGrade) {
        const feeStructures = await db.feeStructure.findMany({
          where: { schoolGradeId: schoolGrade.id, isActive: true },
        });
        const totalFees = feeStructures.reduce((s, f) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
        const paidAmount = student.payments.reduce((s, p) => s + p.amount, 0);
        const pct = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 100;
        const threshold = student.school.feePaymentThreshold ?? 70;
        const policy = student.school.feePaymentPolicy || "PERCENTAGE";
        feesMet = policy === "FULL" ? pct >= 100 : pct >= threshold;
      } else {
        feesMet = true; // No fee structure = no fees required
      }
    }

    isFullyEnrolled = isApproved && feesMet;
  }

  const links = isFullyEnrolled ? fullLinks : limitedLinks;

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
