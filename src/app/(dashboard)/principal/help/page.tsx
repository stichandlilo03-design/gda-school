import DashboardHeader from "@/components/layout/dashboard-header";
import HelpPage from "@/components/help-page";

const sections = [
  {
    icon: "📊", title: "Dashboard", description: "School overview with stats, revenue, and quick actions",
    link: "/principal",
    steps: [
      "Your dashboard gives you a complete overview of your school at a glance.",
      "Top stat cards show: total students, active teachers, revenue collected, and pending tasks.",
      "The activity feed shows recent events — new enrollments, payment submissions, teacher sessions.",
      "Quick action buttons let you jump to common tasks like approving students or reviewing payments.",
    ],
    tips: ["Check your dashboard each morning for overnight activity.", "The pending tasks counter helps you prioritize what needs attention."],
  },
  {
    icon: "📹", title: "Classroom Monitor", description: "Watch live classroom sessions in real-time",
    link: "/principal/monitor",
    steps: [
      "Go to 'Classroom Monitor' to see all active classroom sessions happening right now.",
      "Each active session shows: teacher name, subject, grade, student count, duration, and teacher late status.",
      "Click on a session to view the live blackboard content, chat messages, and student activity.",
      "You can see which students are present, who raised their hand, and the full session timeline.",
      "The monitor auto-refreshes to show real-time data without manual reload.",
    ],
    tips: ["Use this to evaluate teacher performance without entering the classroom.", "Check for teacher punctuality — late arrivals are flagged automatically."],
  },
  {
    icon: "👩‍🏫", title: "Teachers", description: "Manage teachers, assign classes, rate performance, and view profiles",
    link: "/principal/teachers",
    steps: [
      "Go to 'Teachers' to see all teachers registered at your school.",
      "Approve or reject new teacher applications from the pending section.",
      "Click on a teacher to expand their profile — bio, qualifications, classes, and student feedback.",
      "Rate teachers 1-5 stars based on their performance. Ratings are visible on their profile.",
      "Assign teachers to classes from the 'Curriculum' page.",
    ],
  },
  {
    icon: "🎓", title: "Students", description: "Approve enrollments, manage grades, view parent details, and ID info",
    link: "/principal/students",
    steps: [
      "Go to 'Students' to see all enrolled students at your school.",
      "The pending approval section shows new student registrations — approve or reject with optional reason.",
      "Click on any student to see their expanded profile with full details.",
      "The expanded view shows: ID number, photo, grade, fee status, enrolled subjects, recent payments.",
      "Parent/guardian details show both registration info AND linked parent accounts with contact details.",
      "Use 'Promote' to move a student to the next grade level.",
      "Use 'Move' to change a student's grade without promotion (e.g., corrections).",
      "Use 'Suspend' (requires a reason) or 'Reinstate' to manage student status.",
    ],
    tips: ["Filter by grade and status to quickly find specific students.", "Check the parent links section to verify guardian information."],
  },
  {
    icon: "💬", title: "Messages", description: "Communicate with teachers, students, and parents",
    link: "/principal/messages",
    steps: [
      "Go to 'Messages' to see all conversations.",
      "You can message any teacher or student at your school.",
      "Parents who have linked their children can also message you directly.",
      "Click on a conversation to read the full chat history and reply.",
      "The notification bell in the header shows unread message count.",
    ],
  },
  {
    icon: "📋", title: "Interviews", description: "Schedule and manage teacher interviews",
    link: "/principal/interviews",
    steps: [
      "Go to 'Interviews' to manage the teacher interview process.",
      "When teachers apply through vacancies, you can schedule interviews.",
      "Set date, time, and notes for each interview.",
      "Update status as: Scheduled, Completed, or Cancelled.",
      "After interview, approve or reject the teacher from the Teachers page.",
    ],
  },
  {
    icon: "💼", title: "Vacancies", description: "Create job postings for teaching positions",
    link: "/principal/vacancies",
    steps: [
      "Go to 'Vacancies' to create and manage job postings.",
      "Click 'Create Vacancy' — set subject, grade, description, requirements, and salary range.",
      "Published vacancies appear on the public Job Board on the landing page.",
      "Teachers can apply directly. Applications appear for your review.",
      "When you approve a teacher, they're auto-assigned to the relevant class.",
    ],
    tips: ["Write detailed job descriptions to attract quality teachers.", "Set competitive salary ranges based on your country's standards."],
  },
  {
    icon: "💰", title: "Payroll", description: "Manage teacher payments, view session credits, and process salary",
    link: "/principal/payroll",
    steps: [
      "Go to 'Payroll' to manage all teacher payment processing.",
      "The overview shows: total payable, total paid, and pending amounts.",
      "Each teacher card shows: session credits earned, hourly rate, total owed, and payment history.",
      "Click 'Process Payment' to pay a teacher — enter amount, method, and upload proof/receipt.",
      "View individual teacher session history with: date, class, duration, late status, and credit amount.",
      "Switch between Monthly and Weekly views.",
      "Set pay frequency (weekly/bi-weekly/monthly) — the system shows a rate preview.",
    ],
    tips: ["Session credits auto-generate from classroom sessions — you don't need to manually log hours.", "Review the late indicators to identify punctuality issues."],
  },
  {
    icon: "🏦", title: "Fee Structure", description: "Set tuition fees, registration fees, and other charges per grade",
    link: "/principal/fees",
    steps: [
      "Go to 'Fee Structure' to set up fees for each grade level.",
      "Click 'Add Fee Structure' — select grade, term, and enter amounts.",
      "Fee types: Tuition, Registration, Exam, and Technology fees.",
      "You can edit existing fee structures at any time.",
      "Students and parents see their fee breakdown based on these structures.",
      "Set fee payment policy: Percentage (minimum % required), Full (must pay all), or Flexible.",
    ],
    tips: ["Set up fees for each term separately if amounts differ.", "The fee payment threshold controls minimum payment percentage for access."],
  },
  {
    icon: "🏛️", title: "Bank Accounts", description: "Add school payment accounts for students and parents to pay to",
    link: "/principal/bank-accounts",
    steps: [
      "Go to 'Bank Accounts' to add your school's payment receiving accounts.",
      "Click 'Add Account' — enter: bank name, account name, account number, currency, country.",
      "Optional fields: routing/sort code, SWIFT/BIC code, and payment instructions.",
      "These details are shown to students and parents when they make payments.",
      "You can add multiple accounts for different payment methods or currencies.",
      "Toggle accounts active/inactive as needed.",
    ],
    tips: ["Add clear payment instructions to reduce confusion.", "Include mobile money accounts if your country uses them."],
  },
  {
    icon: "💳", title: "Payment Review", description: "Review and approve/reject student and parent payment submissions",
    link: "/principal/payments",
    steps: [
      "Go to 'Payment Review' to see all submitted payments awaiting your review.",
      "Each submission shows: student name, amount, payment method, transaction reference, and proof.",
      "Click 'View Proof' to see the uploaded receipt/screenshot.",
      "Click 'Approve' to confirm the payment — the student's fee balance updates automatically.",
      "Click 'Reject' with a reason if the payment is invalid — the student is notified.",
      "Parents can also submit payments on behalf of their children — these appear here too.",
    ],
    tips: ["Review payments promptly to keep students' access up to date.", "Always verify the transaction reference with your bank."],
  },
  {
    icon: "📖", title: "Curriculum", description: "Create subjects, assign teachers, and manage grades",
    link: "/principal/curriculum",
    steps: [
      "Go to 'Curriculum' to set up your school's academic structure.",
      "First, add grade levels your school offers (e.g., KG1, Grade 1, etc.).",
      "Then create subjects for each grade (e.g., Mathematics, English, Science).",
      "Assign a teacher to each subject — the teacher gets auto-assigned to that class.",
      "Subjects are grouped by the education system structure for your country.",
    ],
  },
  {
    icon: "📅", title: "Timetable", description: "Create and manage the weekly school timetable",
    link: "/principal/timetable",
    steps: [
      "Go to 'Timetable' to set up the weekly class schedule for each grade.",
      "Select a grade from the dropdown to view/edit its timetable.",
      "The grid shows Monday-Friday with 3 session boxes: Morning, Afternoon, Evening.",
      "Click 'Add Period' to add a class to a specific day and session slot.",
      "The dropdown groups available classes by teacher — showing which sessions they're already teaching.",
      "Click 'Auto-Generate' to let the system automatically create a conflict-free timetable.",
      "Auto-generate avoids teacher double-booking across all grades.",
      "Set period times (start/end) for each slot.",
    ],
    tips: ["Auto-generate first, then manually adjust if needed.", "Check for teacher conflicts — the system validates but manual review helps.", "The 3-session structure (AM/PM/Eve) is designed for flexible scheduling."],
  },
  {
    icon: "📈", title: "Reports", description: "View school performance reports and analytics",
    link: "/principal/reports",
    steps: [
      "Go to 'Reports' to see school-wide analytics and performance data.",
      "Reports cover: enrollment trends, attendance rates, fee collection, and academic performance.",
    ],
  },
  {
    icon: "⚙️", title: "School Settings", description: "Configure school details, timing, fee policies, and more",
    link: "/principal/settings",
    steps: [
      "Go to 'Settings' to configure all school-wide settings.",
      "School Info: Update school name, logo, motto, primary/secondary colors.",
      "Timing: Set session duration (default 40 min), break duration (10 min), sessions per day, school hours.",
      "Timezone: Select your timezone so session auto-start/end works correctly.",
      "Fee Policy: Choose between Percentage, Full, or Flexible payment policy.",
      "Fee Threshold: Set minimum payment percentage (e.g., 70%) for student access.",
      "Fee Instructions: Add custom payment instructions shown to students and parents.",
      "Live preview shows exactly how settings will look for students.",
    ],
    tips: ["Set your timezone first — this affects all session scheduling.", "Use the live preview when adjusting session/break timing."],
  },
];

const faqs = [
  { q: "How do students get approved?", a: "When a student registers with your school code, they appear in 'Students' with 'Pending' status. Click 'Approve' to give them access to classes. You can also reject with a reason or suspend later." },
  { q: "How does teacher payment work?", a: "Teachers earn session credits automatically when they teach live classes. Credits = (minutes taught / 60) × hourly rate. You process payments from the Payroll page by uploading proof of payment." },
  { q: "Can parents make payments?", a: "Yes! Parents can pay fees on behalf of their child from the Parent Portal. Their payments appear in your 'Payment Review' page marked as 'Paid by parent/guardian' for your approval." },
  { q: "How do I set up the timetable?", a: "Go to Timetable, select a grade, then either add periods manually or click 'Auto-Generate' for a conflict-free schedule. The system ensures no teacher is double-booked across grades." },
  { q: "What happens when I edit fee structures?", a: "Fee changes are reflected immediately for all students in that grade. Students and parents see updated breakdowns. Existing approved payments are not affected." },
  { q: "How does the classroom monitor work?", a: "The monitor shows all active sessions in real-time. You can see the blackboard content, chat messages, student attendance, and teacher punctuality without entering the virtual classroom." },
  { q: "Can I communicate with parents?", a: "Yes! Parents who link their children can message you from their portal. You'll see their messages in your Messages inbox. You can reply directly." },
  { q: "How do vacancies and auto-assignment work?", a: "Create a vacancy, teachers apply, you approve. Upon approval, the teacher is automatically assigned to the relevant class/subject. The vacancy is then marked as filled." },
  { q: "What education systems are supported?", a: "The platform supports 14 countries: Nigeria (6-3-3-4), Kenya (CBC), Ghana, South Africa, Tanzania, Uganda, Cameroon, UK (Key Stages), USA (K-12), Canada, India (10+2), Australia, Pakistan, and Egypt." },
  { q: "How do I handle late teachers?", a: "The system automatically tracks teacher join times. Late arrivals are flagged in the Classroom Monitor and in the teacher's payroll session history. You can address this through Messages or in person." },
  { q: "What if a student's parent isn't linked?", a: "Students have basic parent info from registration (name, phone, email). For full parent portal access, the parent must register separately and link their child by name/email. You can see both in the student's expanded view." },
];

export default function PrincipalHelpPage() {
  return (
    <>
      <DashboardHeader title="Help & FAQ" subtitle="Learn how to use every feature" />
      <div className="p-6 lg:p-8">
        <HelpPage portalName="Principal" portalColor="from-purple-500 to-violet-600" sections={sections} faqs={faqs} messagesLink="/principal/messages" />
      </div>
    </>
  );
}
