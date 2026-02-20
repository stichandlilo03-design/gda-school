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
      "Go to 'My Classroom' to see live or prep sessions. You'll get an alarm when class starts.",
      "Click on a class to enter. You can join both LIVE and PREP sessions.",
      "PREP sessions: Teacher is setting up. Some content may be hidden (board, polls). A countdown shows time remaining.",
      "Use the blackboard to follow the teacher's lesson. Raise Hand (✋) to ask questions via Q&A.",
      "Chat, Whisper, Notes, Calculator, Whiteboard, Dictionary, and Drawing tools are all available.",
      "When a poll appears, select your answer carefully — answers are LOCKED once selected and cannot be changed.",
      "For Exams/Tests: questions appear one at a time with a countdown timer. Answer before time runs out.",
      "After an exam, wait for the teacher to release results. Your score is saved to your grade record.",
    ],
    tips: ["Join class on time — the system tracks when you arrive.", "Poll/exam answers are locked once selected — think carefully before clicking!", "Enable browser notifications for class alarms. Use Desk/Notebook for personal notes."],
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
    icon: "📅", title: "Academic Calendar", description: "View terms, holidays, exam periods, and school events",
    link: "/student/calendar",
    steps: [
      "Go to 'Academic Calendar' to see your school's full academic year schedule.",
      "The current term is highlighted at the top with start and end dates.",
      "All three terms are shown with their dates — the active one is marked.",
      "Upcoming events include: term starts/ends, mid-term breaks, holidays, exam periods, and public holidays.",
      "Events currently happening show a 'NOW' badge with a highlight.",
      "Holiday durations are shown so you know how many days off you have.",
    ],
    tips: ["Check the calendar regularly to prepare for upcoming exams.", "The calendar follows your country's real academic schedule automatically."],
  },
  {
    icon: "📋", title: "Assignments", description: "View and submit homework, projects, and classwork",
    link: "/student/grades",
    steps: [
      "Go to 'Grades & Assignments' and click the 'Assignments' tab.",
      "You'll see all assignments from your enrolled classes with due dates.",
      "Pending assignments show 'OVERDUE' if past the due date.",
      "Click 'Submit' to open the submission form — type your answer or upload a file.",
      "Supported files: images, PDFs, documents (max 5MB).",
      "After submitting, you'll see 'Submitted' status. The teacher will grade it.",
      "Once graded, your score appears next to the submission.",
    ],
    tips: ["Submit before the due date to avoid overdue marks.", "Your assignment completion rate affects your term report."],
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
