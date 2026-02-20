import DashboardHeader from "@/components/layout/dashboard-header";
import HelpPage from "@/components/help-page";

const sections = [
  {
    icon: "📊", title: "Dashboard", description: "Your home page with salary balance, today's classes, and quick stats",
    link: "/teacher",
    steps: [
      "Your dashboard shows your current salary balance, today's scheduled classes, and student counts.",
      "The salary card shows total earned from teaching sessions — this updates automatically after each class.",
      "Quick stat cards show: total students, classes taught, upcoming sessions, and attendance rates.",
      "Scroll down to see your teaching schedule for today with class times and subjects.",
    ],
    tips: ["Check your dashboard at the start of each day to see your schedule.", "Your salary updates in real-time after each session ends."],
  },
  {
    icon: "🎥", title: "Classroom (Live Teaching)", description: "Start sessions, teach on the blackboard, manage students in real-time",
    link: "/teacher/classroom",
    steps: [
      "Go to 'Classroom' and select the class you want to teach.",
      "Click 'Start' to begin a live class, or 'Prep' to open a prep session (no payment, for setup).",
      "Use the interactive blackboard to write lessons — students see your writing in real-time.",
      "Toggle between 'Board Mode' (writing), 'Voice Mode' (speaking), and 'Video Mode'.",
      "When students raise their hand (✋), respond with Q&A. Use Chat for class-wide messages.",
      "Create Polls, Tests, or Exams from the 📊 panel (students cannot change answers once selected).",
      "For Tests/Exams: add multiple questions with timers, mark correct answers, then 'Save to Gradebook' to auto-create assessment scores.",
      "Click 'End Session' when done — teaching credit is automatically calculated and added to payroll.",
    ],
    tips: ["Sessions auto-start based on timetable. You earn credits for every minute taught.", "Students who arrive late are tracked.", "Poll answers are locked — great for graded quizzes."],
  },
  {
    icon: "📋", title: "Prep Sessions", description: "Set up your class before it starts — board, polls, exams — without payment",
    link: "/teacher/classroom",
    steps: [
      "Choose a prep duration (5–60 min) and click 'Prep' to open a prep session.",
      "Set up your blackboard, create polls/exams, write notes — students can join and see the room.",
      "Use the Hide Controls bar to hide Board, Polls/Exams, Chat, or Q&A from students (e.g., hide exam answers while setting up).",
      "Students see a 'PREP' badge and countdown timer. They can chat if you leave chat visible.",
      "When ready, click 'Go Live' to convert the prep into a real class — all board content is preserved, credits start.",
      "If prep time runs out, the session ends automatically (does NOT auto-convert to live).",
      "Alternatively, click 'Start' on the class card — a new live session is created with your prep board content carried over.",
    ],
    tips: ["Use prep to write exam questions with hidden board, then Go Live to reveal everything at once.", "Prep sessions generate zero payment.", "Good for morning setup before students arrive."],
  },
  {
    icon: "📝", title: "Exams & Tests in Classroom", description: "Run timed, graded exams and tests directly in the live classroom",
    link: "/teacher/classroom",
    steps: [
      "Open the 📊 Polls panel and switch to 'Test' or 'Exam' mode.",
      "Add a title, then add questions with multiple-choice options. Set the correct answer and time limit (10–600 sec) per question.",
      "Click 'Create Exam' to add it to the session. Then click 'Start' to begin — Question 1 appears for students.",
      "Click 'Next Q →' to advance to each question. Students see a countdown timer per question.",
      "Students' answers are LOCKED once selected — they cannot change their answer (anti-cheat).",
      "In Exam mode: students cannot see results until you click 'Release Results'. In Test mode: results show automatically.",
      "Click 'Save to Gradebook' to auto-create an Assessment with all student scores — flows into term reports via principal approval.",
    ],
    tips: ["Exams save as END_OF_TERM_EXAM type, Tests as MID_TERM_TEST type.", "Use Prep mode to set up exam questions with board hidden, then Go Live.", "Results flow through the anti-cheat grading pipeline: Teacher → Principal Approval → Student/Parent view."],
  },
  {
    icon: "📚", title: "My Classes", description: "View your assigned classes, subjects, student lists, and requirements",
    link: "/teacher/classes",
    steps: [
      "Go to 'My Classes' to see all classes assigned to you by the principal.",
      "Each class card shows: subject name, grade level, student count, and schedule.",
      "Click on a class to expand it — you'll see the full student list with their status.",
      "Use the 'Requirements' tab to set up class requirements (textbooks, materials, equipment).",
      "Use the 'Equipment' tab to list what students need for your class.",
      "If you teach multiple subjects across different grades, all classes appear here.",
    ],
  },
  {
    icon: "👨‍🎓", title: "Students", description: "View enrolled students, manage enrollment, and communicate",
    link: "/teacher/students",
    steps: [
      "Go to 'Students' to see all students enrolled in your classes.",
      "Filter by class/subject to see specific groups.",
      "Click on a student to see their details — attendance, grades, enrollment status.",
      "Use 'Remove Student' to unenroll a student from your class if needed.",
      "The system shows online/offline status with green/gray dots.",
    ],
  },
  {
    icon: "💬", title: "Messages", description: "Chat with students, parents, and school principal",
    link: "/teacher/messages",
    steps: [
      "Go to 'Messages' to see all conversations with students, parents, and the principal.",
      "Click on a conversation to read the full chat history.",
      "Type your message and press Send or Enter to reply.",
      "New message notifications appear on the bell icon in the header.",
      "Parents of your students can message you directly from their portal.",
    ],
    tips: ["Check messages regularly — parents may have important questions about their child.", "You can message the principal about school matters."],
  },
  {
    icon: "📝", title: "Gradebook", description: "Create assessments, enter grades, and track student performance",
    link: "/teacher/gradebook",
    steps: [
      "Go to 'Gradebook' and select the class you want to grade.",
      "Click 'Create Assessment' to add a new test, exam, quiz, project, or homework.",
      "Set the title, type, max score, weight, and due date.",
      "After creating, click 'Enter Grades' to input scores for each student.",
      "Students and parents can see their grades once you save them.",
      "You can add written feedback for each student alongside their score.",
    ],
    tips: ["Use different assessment types (test, exam, project) for varied evaluation.", "Weights affect final grade calculation — exams typically have higher weight."],
  },
  {
    icon: "✅", title: "Attendance", description: "Mark student attendance for each class session",
    link: "/teacher/attendance",
    steps: [
      "Go to 'Attendance' and select the class and date.",
      "You'll see a list of all enrolled students.",
      "Mark each student as Present, Absent, or Late.",
      "Attendance is also auto-tracked when students join live classroom sessions.",
      "The system records exact join times — late arrivals are automatically flagged.",
    ],
  },
  {
    icon: "📁", title: "Materials", description: "Upload and manage teaching materials for your classes",
    link: "/teacher/materials",
    steps: [
      "Go to 'Materials' and select the class to upload for.",
      "Click 'Add Material' — choose a file type (document, video, image, link).",
      "Use templates for quick setup: Lesson Plan, Worksheet, Study Guide, Notes.",
      "Give the material a title and description so students know what it is.",
      "Materials appear immediately for all enrolled students.",
      "Click 'Edit' to update a material's title, description, or replace the file.",
    ],
    tips: ["Organize materials by topic for easy student access.", "Keep file sizes under 5MB for best upload experience."],
  },
  {
    icon: "📅", title: "Timetable", description: "View your personalized weekly teaching schedule",
    link: "/teacher/timetable",
    steps: [
      "Go to 'Timetable' to see your weekly teaching schedule.",
      "The grid shows Monday through Friday with all your assigned time slots.",
      "Each slot shows: subject, grade, and session badge (AM/PM/Eve).",
      "If you teach multiple subjects across different grades, all appear in one unified view.",
      "Current/next class is highlighted for easy reference.",
    ],
  },
  {
    icon: "💰", title: "My Payroll", description: "Track earnings, view session credits, and request payment",
    link: "/teacher/payroll",
    steps: [
      "Go to 'My Payroll' to see your complete earnings summary.",
      "The 'Salary Balance' card shows your total earned from auto-tracked sessions.",
      "The 'Session Credits' tab shows every classroom session with: date, duration, class, late status, and credit amount.",
      "Each session you teach automatically generates a credit based on your hourly rate and session duration.",
      "View your payment history — approved payments, pending requests, and transaction references.",
      "When the principal processes payroll, your payment shows with proof (receipt/reference).",
    ],
    tips: ["Minimum session credit is 1 minute (for network issues).", "Late arrivals to your own class are tracked and visible to the principal.", "Your bank account details are viewable by the principal for payment."],
  },
  {
    icon: "💼", title: "Job Board", description: "Browse and apply for teaching vacancies at other schools",
    link: "/teacher/vacancies",
    steps: [
      "Go to 'Job Board' to see available teaching positions at schools on the platform.",
      "Filter by subject, grade level, or location.",
      "Click 'View Details' to see full job description, requirements, and salary.",
      "Click 'Apply' to submit your application — your profile is shared with the school.",
    ],
  },
  {
    icon: "👤", title: "My Profile", description: "Edit your bio, upload photo, set up public profile, and ID card",
    link: "/teacher/profile",
    steps: [
      "Go to 'My Profile' to manage your professional teaching profile.",
      "Upload a profile photo and intro video (visible to students and parents).",
      "Edit your bio, qualifications, teaching style, and years of experience.",
      "Set your public profile slug to create a shareable URL (e.g., gdaschools.sbs/profile/teacher/your-name).",
      "Your profile shows your rating (1-5 stars) based on student reviews.",
      "Generate and print your Teacher ID card with the school's branding.",
    ],
    tips: ["A complete profile helps students and parents trust you.", "Record a short intro video to showcase your teaching style."],
  },
];

const faqs = [
  { q: "How do I get paid?", a: "Your earnings are tracked automatically every time you teach a live session. The principal processes payments on a regular schedule (weekly/bi-weekly/monthly). Your bank account details are needed — set them up in your profile." },
  { q: "How are my session credits calculated?", a: "Credits = (session duration in minutes / 60) × your hourly rate. Minimum 1 minute counted. Sessions auto-start based on timetable and auto-end at the school's configured session length." },
  { q: "Can I teach multiple subjects?", a: "Yes! The principal can assign you to multiple classes across different subjects and grade levels. Your timetable will show all classes in a unified view." },
  { q: "What happens if I'm late to my own class?", a: "The system records your exact join time. If you arrive after the scheduled start, the late minutes are recorded and visible to the principal in the monitoring dashboard." },
  { q: "How do I handle disruptive students?", a: "You can remove students from your class enrollment. For immediate issues during a live session, use the chat or whisper features. Contact the principal through Messages for serious concerns." },
  { q: "Can parents message me?", a: "Yes! Parents who have linked their child's account can see your name and message you directly from their portal. You'll receive the message in your Messages inbox." },
  { q: "How do polls work in the classroom?", a: "During a live session, click 'Create Poll'. Enter your question and options, mark the correct answer. Students vote in real-time. You can see who voted what and close the poll to reveal results." },
  { q: "What if my session credits aren't showing?", a: "Session credits are generated when a session ends. Make sure you click 'End Session' or wait for auto-end. Credits appear in the 'Session Credits' tab of your Payroll page." },
  { q: "How do I share my public profile?", a: "Go to Profile, set a profile slug (your-name), then share the link: gdaschools.sbs/profile/teacher/your-name. Anyone can view your public profile without logging in." },
  { q: "Can I edit materials after uploading?", a: "Yes! Go to Materials, find the material, and click the Edit button. You can update the title, description, or replace the file entirely." },
];

export default function TeacherHelpPage() {
  return (
    <>
      <DashboardHeader title="Help & FAQ" subtitle="Learn how to use every feature" />
      <div className="p-6 lg:p-8">
        <HelpPage portalName="Teacher" portalColor="from-emerald-500 to-teal-600" sections={sections} faqs={faqs} messagesLink="/teacher/messages" />
      </div>
    </>
  );
}
