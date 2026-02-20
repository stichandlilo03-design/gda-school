import DashboardHeader from "@/components/layout/dashboard-header";
import HelpPage from "@/components/help-page";

const sections = [
  {
    icon: "📊", title: "Dashboard", description: "Overview of all your children's school activities at a glance",
    link: "/parent",
    steps: [
      "Your dashboard shows a summary of all linked children in one place.",
      "Quick stat cards show: number of children linked, total subjects, average attendance, and schools count.",
      "Each child has an expandable card showing their grade, school, subjects, recent grades, attendance, and fees.",
      "Click 'Link a Child' to add more children to your account.",
      "Use the quick link buttons on each child card to jump directly to their attendance, grades, fees, or timetable.",
    ],
    tips: ["Link all your children to see everything in one dashboard.", "Check the dashboard daily to stay on top of your children's progress."],
  },
  {
    icon: "👧", title: "My Children", description: "Link and manage your children's accounts",
    link: "/parent/children",
    steps: [
      "Go to 'My Children' to see all linked children and add new ones.",
      "To link a child, enter their registered email OR full name in the search box.",
      "The system also auto-links any student whose registration listed your email as parent/guardian.",
      "Each child card shows: photo, school name, grade level, subjects count, attendance rate, and fee status.",
      "Click 'Unlink' to remove a child from your account (this doesn't affect their school enrollment).",
      "Click on enrolled subjects to see the tags of all subjects they're taking.",
    ],
    tips: ["Make sure your child registered with your email as parent contact — this enables auto-linking.", "You can link children from different schools on the same account."],
  },
  {
    icon: "✅", title: "Attendance", description: "Track your children's class attendance in detail",
    link: "/parent/attendance",
    steps: [
      "Go to 'Attendance' to see detailed attendance records for each child.",
      "The overview shows: total classes, present count, absent count, late count, and attendance percentage.",
      "The circular ring chart gives a quick visual of the attendance rate.",
      "Color coding: Green (80%+) = Good, Amber (60-80%) = Needs attention, Red (below 60%) = Concerning.",
      "Scroll down to see the full attendance history with date, subject, and status for each record.",
      "If you have multiple children, switch between them using the child selector tabs.",
    ],
    tips: ["Aim for 80%+ attendance for the best academic outcomes.", "If your child is marked 'Late', the system records the exact minutes."],
  },
  {
    icon: "📊", title: "Grades & Reports", description: "View test scores, assessments, and academic performance",
    link: "/parent/grades",
    steps: [
      "Go to 'Grades & Reports' to see all your children's academic scores.",
      "Scores are grouped by subject with the average percentage shown for each.",
      "Each assessment shows: title, type (test/exam/project), score, max score, and percentage.",
      "Color coding: Green (70%+) = Good performance, Amber (50-69%) = Average, Red (below 50%) = Needs improvement.",
      "Use this to identify which subjects your child excels in and where they need support.",
    ],
    tips: ["Compare subject averages to find strengths and weaknesses.", "Discuss low grades with the teacher through Messages."],
  },
  {
    icon: "💰", title: "Fees & Payments", description: "View fee breakdown, pay on behalf of your child, and track payment status",
    link: "/parent/fees",
    steps: [
      "Go to 'Fees & Payments' to see the full financial picture for each child.",
      "Each child's card shows: Total Fees, Amount Paid, Pending Review, and Outstanding Balance.",
      "The progress bar shows what percentage of fees have been paid.",
      "Scroll down to see the 'Fee Breakdown' — tuition, registration, exam, and technology fees itemized.",
      "The 'School Payment Accounts' section shows the school's bank details. Use the copy button (📋) to copy account numbers.",
      "Click 'Pay on Behalf of [Child Name]' to submit a payment.",
      "Fill in: amount, payment method, transaction reference, optional note, and upload proof (receipt/screenshot).",
      "Your payment goes to 'Under Review'. The school principal will verify and approve it.",
      "Once approved, your child's fee balance updates and they get full platform access.",
      "View full payment history at the bottom with status badges for each payment.",
    ],
    tips: ["Take a clear screenshot of your payment receipt for upload.", "Keep file size under 5MB for proof uploads.", "You can pay partial amounts — the balance updates accordingly.", "Check if the school has fee instructions displayed for special payment notes."],
  },
  {
    icon: "👩‍🏫", title: "Teachers", description: "View all teachers across your children's schools",
    link: "/parent/teachers",
    steps: [
      "Go to 'Teachers' to see all teachers teaching your children.",
      "Each teacher card shows: name, photo, subjects taught, which of your children they teach, and rating.",
      "Online teachers show a green status dot.",
      "Verified teachers show a blue checkmark badge.",
      "Click on a teacher's profile link to view their full public profile (bio, qualifications, intro video).",
      "You can message any teacher directly from the Messages page.",
    ],
  },
  {
    icon: "📅", title: "Timetable", description: "View weekly class schedules for all your children",
    link: "/parent/timetable",
    steps: [
      "Go to 'Timetable' to see the weekly class schedule for each child.",
      "The grid view shows Monday-Friday with all scheduled classes.",
      "Each slot shows: subject name, teacher name, time range, and session badge (AM/PM/Eve).",
      "Classes are color-coded by subject for easy visual identification.",
      "School hours are displayed in the header for reference.",
      "If you have multiple children, switch between them to see each schedule.",
    ],
    tips: ["Use the timetable to know when your child should be in class.", "Compare with attendance to verify your child is attending scheduled classes."],
  },
  {
    icon: "💬", title: "Messages", description: "Chat directly with teachers and school principals",
    link: "/parent/messages",
    steps: [
      "Go to 'Messages' to communicate with your children's teachers and school principals.",
      "The left sidebar shows two sections: 'Conversations' (existing chats) and 'Your Children's Staff' (new contacts).",
      "Click on any teacher or principal to open a chat conversation.",
      "Type your message and press Send or Enter to send.",
      "Messages update in real-time — new messages appear automatically.",
      "Unread messages show a red badge count on the contact in the sidebar.",
      "The notification bell in the header also shows your unread message count.",
      "Search contacts by name using the search bar at the top of the sidebar.",
    ],
    tips: ["Introduce yourself when messaging a teacher for the first time.", "Use Messages to discuss grades, attendance, or any concerns about your child.", "Check messages regularly for important school updates."],
  },
  {
    icon: "👤", title: "My Profile", description: "Edit your personal details and account information",
    link: "/parent/profile",
    steps: [
      "Go to 'My Profile' to view and edit your personal information.",
      "Your account details (name, email, country) are shown at the top.",
      "Edit your: phone number, relationship to children, occupation, and address.",
      "The 'Linked Children' section shows all children connected to your account with their school and grade.",
      "Click 'Save Changes' after making any edits.",
    ],
  },
];

const faqs = [
  { q: "How do I link my child to my account?", a: "Go to 'My Children' or the Dashboard, enter your child's registered email or full name, and click 'Link Child'. If your child registered with your email as parent contact, they may be auto-linked." },
  { q: "Can I link children from different schools?", a: "Yes! You can link children from any school on the platform. Each child's card shows their school name, and fees/timetable are school-specific." },
  { q: "How do I pay my child's school fees?", a: "Go to 'Fees & Payments', find your child's card, click 'Pay on Behalf'. Enter the payment amount, method, transaction reference, upload proof, and submit. The principal will review and approve." },
  { q: "What payment methods are accepted?", a: "This depends on your school. Common methods include: Bank Transfer, Mobile Money, Cash Deposit, Online Transfer, and Card Payment. Check the school's bank account details and instructions on the Fees page." },
  { q: "Why was my payment rejected?", a: "The principal may reject a payment if the proof is unclear, the amount doesn't match, or the transaction can't be verified. You'll see the rejection reason. You can submit a new payment with corrected details." },
  { q: "Can I message any teacher?", a: "You can message teachers who are assigned to your children's classes and the school principal. They appear automatically in your Messages contacts list." },
  { q: "Why can't I see my child's data?", a: "Make sure your child is properly linked. Go to 'My Children' and verify they appear in the list. If not, try linking again with their exact registered name or email." },
  { q: "Does my child know I can see their grades?", a: "The platform is transparent — students know that parents who register can view their academic data. This promotes accountability and family involvement." },
  { q: "How do notifications work?", a: "You receive notifications for new messages from teachers and principals. The bell icon in the header shows unread count. Notifications appear in a dropdown when you click the bell." },
  { q: "What if I have children at different schools?", a: "Everything works seamlessly. Each child's data is school-specific — fees show the correct school's bank accounts, timetable follows their school's schedule, and teachers are from their school." },
  { q: "Can I unlink a child?", a: "Yes, go to 'My Children' and click 'Unlink' on the child's card. This only removes the link — it doesn't affect their school enrollment or data." },
  { q: "Is my personal information visible to teachers?", a: "Teachers and principals can see your name when you message them, but your email and phone number are not shared. Communication happens only through the in-platform messaging system." },
];

export default function ParentHelpPage() {
  return (
    <>
      <DashboardHeader title="Help & FAQ" subtitle="Learn how to use every feature" />
      <div className="p-6 lg:p-8">
        <HelpPage portalName="Parent" portalColor="from-rose-500 to-pink-600" sections={sections} faqs={faqs} messagesLink="/parent/messages" />
      </div>
    </>
  );
}
