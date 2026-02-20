import DashboardHeader from "@/components/layout/dashboard-header";
import HelpPage from "@/components/help-page";

const sections = [
  {
    icon: "📊", title: "Dashboard", description: "Your home page with daily overview, schedule, and quick stats",
    link: "/student",
    steps: [
      "Your dashboard shows today's classes, upcoming schedule, and important alerts at a glance.",
      "The top banners will notify you about incomplete profile, pending fees, or interview requests.",
      "Scroll down to see your classmates, term information, and quick links to all features.",
      "If you're in KG (ages 1-5), you'll see a special colorful dashboard designed for young learners.",
    ],
    tips: ["Check your dashboard daily to stay on top of your schedule.", "Complete your profile to unlock all features."],
  },
  {
    icon: "🎥", title: "My Classroom", description: "Join live classes, interact with teachers, and participate in lessons",
    link: "/student/classroom",
    steps: [
      "Go to 'My Classroom' to see if a live session is running right now.",
      "Click 'Join Session' to enter the virtual classroom.",
      "Use the interactive blackboard to follow the teacher's lesson in real-time.",
      "Click 'Raise Hand' (✋) to ask a question — the teacher will see your request and can respond.",
      "Use the Chat panel to send messages to classmates and the teacher during class.",
      "Access classroom tools: Notes, Calculator, Whiteboard, Dictionary, and Drawing tools from the toolbar.",
      "You can customize your board theme (6 themes) and color (7 colors) from the settings icon.",
      "When a poll appears, click your answer — you'll see results after the teacher closes it.",
      "Use the 'Whisper' feature to send a private message to the teacher without other students seeing.",
    ],
    tips: ["Join class on time — the system tracks when you arrive.", "Use the Desk/Notebook feature to take notes during class that persist between sessions.", "Enable browser notifications to get alerted when class starts."],
  },
  {
    icon: "📚", title: "My Subjects", description: "View and manage your enrolled subjects",
    link: "/student/subjects",
    steps: [
      "Go to 'My Subjects' to see all subjects you're currently enrolled in.",
      "Each subject card shows the teacher's name, class schedule, and your progress.",
      "Click on a subject to see more details about assignments, materials, and grades.",
    ],
  },
  {
    icon: "👩‍🏫", title: "Browse Teachers", description: "Find teachers, view profiles, and enroll in their classes",
    link: "/student/teachers",
    steps: [
      "Go to 'Browse Teachers' to see all available teachers at your school.",
      "Use filters to search by subject, grade level, or teacher name.",
      "Click on a teacher card to see their full profile — bio, qualifications, rating, intro video.",
      "Teachers with a green dot (🟢) are currently online.",
      "Click 'Enroll' on a teacher's class to join that subject. Some teachers teach multiple subjects.",
      "If a teacher teaches multiple subjects, you'll see all available classes in their expanded view.",
    ],
    tips: ["Watch the teacher's intro video before enrolling to see their teaching style.", "Check teacher ratings from other students before choosing."],
  },
  {
    icon: "💬", title: "Messages", description: "Send and receive messages from teachers and school staff",
    link: "/student/messages",
    steps: [
      "Go to 'Messages' to see all your conversations.",
      "Click on a conversation to read messages.",
      "Type your message at the bottom and press Send or hit Enter.",
      "You'll see a notification badge on the bell icon when you have unread messages.",
      "Messages are organized by conversation — each teacher/principal has their own thread.",
    ],
  },
  {
    icon: "📅", title: "Timetable", description: "View your weekly class schedule",
    link: "/student/timetable",
    steps: [
      "Go to 'Timetable' to see your weekly class schedule in a grid format.",
      "Today's classes are highlighted. The current/next class shows a special indicator.",
      "Each slot shows the subject, teacher name, and time (AM/PM format).",
      "Session badges (AM/PM/Eve) show which time slot each class is in.",
      "Your timetable is personalized — you only see classes for your grade level.",
    ],
  },
  {
    icon: "📊", title: "My Grades", description: "View your test scores and academic performance",
    link: "/student/grades",
    steps: [
      "Go to 'My Grades' to see all your assessment scores.",
      "Grades are organized by subject with averages shown.",
      "Each assessment shows: title, type (test/exam/project), your score, max score, and percentage.",
      "Color coding: Green (70%+) = Good, Amber (50-69%) = Average, Red (below 50%) = Needs improvement.",
    ],
  },
  {
    icon: "✅", title: "Attendance", description: "Track your class attendance record",
    link: "/student/attendance",
    steps: [
      "Go to 'Attendance' to see your attendance history.",
      "The overview shows: total classes, present count, absent count, late count, and your attendance percentage.",
      "Each record shows the date, class, and status (Present/Absent/Late).",
      "Your attendance is automatically tracked when you join live classroom sessions.",
    ],
    tips: ["Keep your attendance above 80% to maintain good standing.", "If you join class late, it's recorded as 'Late' with the exact minutes."],
  },
  {
    icon: "📁", title: "Materials", description: "Access teaching materials shared by your teachers",
    link: "/student/materials",
    steps: [
      "Go to 'Materials' to see all resources shared by your teachers.",
      "Materials are organized by subject and class.",
      "Click on a material to view or download it (PDFs, documents, images, videos).",
      "New materials appear automatically after your teacher uploads them.",
    ],
  },
  {
    icon: "💰", title: "School Fees", description: "View fee breakdown, make payments, and track payment status",
    link: "/student/fees",
    steps: [
      "Go to 'School Fees' to see your complete fee breakdown (tuition, registration, exam, technology fees).",
      "The overview shows: total fees, amount paid, pending review, and outstanding balance.",
      "Scroll down to see the school's bank account details — copy account numbers with one click.",
      "After making a payment (bank transfer, mobile money, etc.), click 'Upload Proof'.",
      "Fill in the amount, payment method, transaction reference, and upload a screenshot/receipt.",
      "Your proof goes to the principal for review. You'll see the status change from 'Under Review' to 'Approved'.",
      "Once fees are fully paid, you get full access to all educational features.",
    ],
    tips: ["Keep your payment receipts safe.", "Upload clear, legible screenshots of your payment.", "Your parent/guardian can also pay on your behalf from their portal."],
  },
  {
    icon: "🪪", title: "Profile & ID Card", description: "Upload your photo, generate student ID, and download your ID card",
    link: "/student/profile",
    steps: [
      "Go to 'Profile & ID Card' to manage your student profile.",
      "Upload a profile photo by clicking the camera icon on your avatar.",
      "Click 'Generate My Student ID Number' to get a unique ID (format: GDA-2026-0042).",
      "Your ID card shows: photo, name, grade, school, ID number, and enrolled date.",
      "Click 'Print' to print your ID card or 'Download' to save it as an image.",
    ],
    tips: ["Use a clear, well-lit photo of your face for the ID card.", "Your ID number is permanent and unique to you."],
  },
  {
    icon: "🏆", title: "Certificates", description: "View certificates awarded to you",
    link: "/student/certificates",
    steps: [
      "Go to 'Certificates' to see all certificates you've earned.",
      "Certificates are awarded by your school for achievements, completion, and excellence.",
    ],
  },
];

const faqs = [
  { q: "How do I join a live class?", a: "Go to 'My Classroom' and click 'Join Session' when a class is active. Your teacher must start the session first. You'll see a countdown timer if class hasn't started yet." },
  { q: "Why can't I access some features?", a: "Some features require fee payment. If your fees are outstanding, you may have limited access. Pay your fees through the 'School Fees' page to unlock everything." },
  { q: "How do I enroll in new subjects?", a: "Go to 'Browse Teachers', find the teacher/subject you want, and click 'Enroll'. You can enroll in multiple subjects. The system detects teachers who teach more than one subject." },
  { q: "How does attendance tracking work?", a: "Attendance is automatically recorded when you join live classroom sessions. If you join after the scheduled start time, you'll be marked as 'Late' with the exact minutes shown." },
  { q: "Can I change my grade level?", a: "No, grade changes must be done by your school's principal. Contact your principal if you believe you're in the wrong grade." },
  { q: "How do I raise my hand during class?", a: "In the live classroom, click the ✋ 'Raise Hand' button. Your teacher will see your request and can respond. You can also use the 'Whisper' feature to message the teacher privately." },
  { q: "What happens when I upload payment proof?", a: "Your payment goes to 'Under Review' status. The school principal will verify your payment and approve or reject it. Once approved, your fee balance updates automatically." },
  { q: "How do I customize my classroom view?", a: "In the live classroom, click the settings/theme icon to choose from 6 board themes and 7 color options. Your preferences are saved for next time." },
  { q: "Can my parent see my grades?", a: "Yes! If your parent/guardian has registered on the Parent Portal and linked your account, they can see your grades, attendance, fees, and timetable." },
  { q: "How do I get my Student ID card?", a: "Go to 'Profile & ID Card', upload your photo, click 'Generate My Student ID Number', then print or download your card." },
  { q: "What's the Desk/Notebook feature?", a: "In the classroom, the Desk tool lets you take personal notes during class. Your notes are saved and available next time you return — like a real school notebook." },
  { q: "How do the class alarms work?", a: "You'll hear a school bell sound when class is about to start, and notifications will appear. Make sure browser notifications are enabled for the best experience." },
];

export default function StudentHelpPage() {
  return (
    <>
      <DashboardHeader title="Help & FAQ" subtitle="Learn how to use every feature" />
      <div className="p-6 lg:p-8">
        <HelpPage portalName="Student" portalColor="from-blue-500 to-indigo-600" sections={sections} faqs={faqs} messagesLink="/student/messages" />
      </div>
    </>
  );
}
