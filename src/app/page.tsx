import Link from "next/link";
import { db } from "@/lib/db";
import {
  BookOpen,
  Users,
  Globe,
  Award,
  Clock,
  Shield,
  GraduationCap,
  ChevronRight,
  Play,
  Star,
  CheckCircle2,
  Briefcase,
  MapPin,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  // Fetch public vacancies for landing page
  let vacancies: any[] = [];
  try {
    vacancies = await db.vacancy.findMany({
      where: { status: "OPEN", isPublic: true },
      include: {
        school: { select: { name: true, countryCode: true, currency: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch {}

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-600">GDA</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">How It Works</Link>
            <Link href="#grades" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Grade Levels</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Pricing</Link>
            <Link href="#jobs" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Jobs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Sign In</Link>
            <Link href="/register/student" className="btn-primary">Enroll Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-white" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-accent-100/40 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-100/60 text-brand-600 rounded-full px-4 py-1.5 text-sm font-medium mb-6 animate-fade-in">
              <Globe className="w-4 h-4" />
              Available in 50+ countries
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-brand-900 leading-[1.1] tracking-tight mb-6 animate-slide-up">
              A Real School.
              <br />
              <span className="text-brand-500">Fully Digital.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              From Kindergarten to Senior Secondary — attend classes, choose your teachers,
              earn real certificates. Every class runs 3 times daily so you never miss a lesson.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link href="/register/student" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
                Start Learning Today
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
              <Link href="/register/teacher" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
                Apply as Teacher
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "15", label: "Grade Levels", sub: "K1 to G12" },
              { value: "3x", label: "Daily Sessions", sub: "Never miss class" },
              { value: "50+", label: "Countries", sub: "Any curriculum" },
              { value: "100%", label: "Digital", sub: "Real certificates" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="text-3xl md:text-4xl font-extrabold text-brand-600">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything a Real School Has. Online.</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We didn&apos;t just build a video call app. We built an entire school with classrooms,
              seating charts, attendance registers, report cards, and certificates.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Choose Your Teacher",
                desc: "Browse teacher profiles, read reviews, watch intro videos. Pick the teacher that fits your learning style for each subject.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: Clock,
                title: "3x Daily Sessions",
                desc: "Every class runs at 3 different times — morning, afternoon, and evening. Students across all time zones are covered.",
                color: "bg-amber-100 text-amber-600",
              },
              {
                icon: Globe,
                title: "Any Country, Any Curriculum",
                desc: "Nigerian 6-3-3-4, British GCSE, American K-12, Indian CBSE — our adaptive engine maps to your national standards.",
                color: "bg-emerald-100 text-emerald-600",
              },
              {
                icon: BookOpen,
                title: "Virtual Classroom",
                desc: "Real seating charts, whiteboards, hand-raising, live chat, breakout rooms, and automatic recording of every session.",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: Award,
                title: "Verified Certificates",
                desc: "Every grade completion earns a blockchain-verified digital certificate. QR-scannable for instant verification by anyone.",
                color: "bg-rose-100 text-rose-600",
              },
              {
                icon: Shield,
                title: "Complete School System",
                desc: "School rules, anthem, assemblies, report cards, parent notifications, and a principal who runs the show.",
                color: "bg-cyan-100 text-cyan-600",
              },
            ].map((feature, i) => (
              <div key={i} className="card group hover:border-brand-200">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Four simple steps to start your digital education journey.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Register", desc: "Create your account as a student, teacher, or school principal. Select your country and grade level." },
              { step: "02", title: "Choose Teachers", desc: "Browse available teachers for each subject. Read reviews, compare styles, and enroll in the classes you want." },
              { step: "03", title: "Attend Class", desc: "Join your scheduled sessions (morning, afternoon, or evening). Interact live with teachers and classmates." },
              { step: "04", title: "Earn Certificate", desc: "Complete your assessments, pass your exams, and receive blockchain-verified certificates." },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-brand-200" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grade Levels */}
      <section id="grades" className="py-24 bg-brand-600">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">All Grade Levels Covered</h2>
            <p className="text-brand-200 max-w-xl mx-auto">From first steps in Kindergarten to Senior Secondary graduation.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { level: "Foundation", grades: "K1 – K3", years: "3 years", color: "from-pink-400 to-rose-500" },
              { level: "Lower Primary", grades: "G1 – G3", years: "3 years", color: "from-blue-400 to-indigo-500" },
              { level: "Upper Primary", grades: "G4 – G6", years: "3 years", color: "from-emerald-400 to-teal-500" },
              { level: "Junior Secondary", grades: "G7 – G9", years: "3 years", color: "from-amber-400 to-orange-500" },
              { level: "Senior Secondary", grades: "G10 – G12", years: "3 years", color: "from-purple-400 to-violet-500" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 text-center hover:bg-white/20 transition-colors">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.level}</h3>
                <p className="text-brand-200 text-sm font-medium">{item.grades}</p>
                <p className="text-brand-300 text-xs mt-1">{item.years}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Three Portals. One School.</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Each user type gets a purpose-built experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Student Portal",
                desc: "Virtual classroom, timetable, grades, teachers list, certificate wall, textbook links, and class library.",
                link: "/register/student",
                btnText: "Enroll as Student",
                features: ["Choose your teachers", "Virtual seating & classroom", "Track grades in real-time", "Download certificates"],
                gradient: "from-blue-500 to-brand-600",
              },
              {
                title: "Teacher Portal",
                desc: "Class management, gradebook, attendance, lesson planner, materials library, and earnings dashboard.",
                link: "/register/teacher",
                btnText: "Apply as Teacher",
                features: ["Manage multiple classes", "Full gradebook system", "Upload materials & resources", "Track your earnings"],
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                title: "Principal Portal",
                desc: "School dashboard, teacher & student management, fee control, curriculum settings, and reports.",
                link: "/register/principal",
                btnText: "Create Your School",
                features: ["Full school oversight", "Set fees & curriculum", "Hire & manage teachers", "Issue certificates"],
                gradient: "from-amber-500 to-orange-600",
              },
            ].map((portal, i) => (
              <div key={i} className="card border-0 shadow-lg overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${portal.gradient}`} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{portal.title}</h3>
                  <p className="text-sm text-gray-600 mb-6">{portal.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {portal.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={portal.link} className="btn-primary w-full">
                    {portal.btnText}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs / Vacancies Section */}
      <section id="jobs" className="py-24 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-4 py-1.5 mb-4">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Teaching Opportunities</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join Our Schools as a Teacher
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Schools on GDA are hiring qualified teachers. Browse open positions and start your teaching journey.
            </p>
          </div>

          {vacancies.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {vacancies.map((v: any) => {
                  const subjects = Array.isArray(v.subjects) ? v.subjects as string[] : [];
                  return (
                    <div key={v.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-brand-200 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-brand-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{v.title}</h3>
                          <p className="text-xs text-gray-500">{v.school.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{v.description}</p>
                      <div className="space-y-2 mb-4">
                        {v.gradeLevel && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <GraduationCap className="w-3.5 h-3.5" /> {v.gradeLevel}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5" /> {v.school.countryCode}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users className="w-3.5 h-3.5" /> {v._count.applications} applicant{v._count.applications !== 1 ? "s" : ""}
                        </div>
                        {(v.salaryMin || v.salaryMax) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">{v.school.currency || "USD"} {v.salaryMin?.toLocaleString()}{v.salaryMax ? ` - ${v.salaryMax.toLocaleString()}` : ""}</span>
                          </div>
                        )}
                      </div>
                      {subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {subjects.filter(Boolean).slice(0, 3).map((s: string, i: number) => (
                            <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-[10px] text-gray-400">{v.employmentType?.replace("_", " ")}</span>
                        <Link href="/vacancies" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                          Apply <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <Link href="/vacancies" className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-all">
                  View All Jobs <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No open positions right now</p>
              <p className="text-sm text-gray-400">Check back soon or register as a teacher to be notified.</p>
              <Link href="/register/teacher" className="inline-flex items-center gap-2 mt-6 bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700">
                Register as Teacher <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            The Future of Education Starts Here
          </h2>
          <p className="text-lg text-brand-200 mb-10 max-w-2xl mx-auto">
            Join thousands of students and teachers building the next generation of education.
            No borders. No limits. Just learning.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register/student" className="btn-accent text-base px-10 py-4 w-full sm:w-auto">
              Start Free Trial
            </Link>
            <Link href="/register/principal" className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 bg-transparent px-10 py-4 text-base font-semibold text-white transition-all hover:bg-white/10 w-full sm:w-auto">
              Create a School
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 text-gray-400 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Global Digital Academy</span>
              </div>
              <p className="text-sm leading-relaxed">
                A fully digital school platform. Real classes, real teachers, real certificates.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/register/student" className="hover:text-white transition-colors">Student Portal</Link></li>
                <li><Link href="/register/teacher" className="hover:text-white transition-colors">Teacher Portal</Link></li>
                <li><Link href="/register/principal" className="hover:text-white transition-colors">Principal Portal</Link></li>
                <li><Link href="#grades" className="hover:text-white transition-colors">Grade Levels</Link></li>
                <li><Link href="/vacancies" className="hover:text-white transition-colors">Teaching Jobs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Curriculum Guide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Teacher Training</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Child Safety</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Global Digital Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
