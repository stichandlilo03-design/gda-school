import Link from "next/link";
import { db } from "@/lib/db";
import { GraduationCap, Globe, Users, BookOpen, Shield, Video, Briefcase, MapPin, ArrowRight, Star, CheckCircle, Zap, Clock, DollarSign } from "lucide-react";

export default async function LandingPage() {
  let vacancies: any[] = [];
  let schoolCount = 0;
  let teacherCount = 0;
  let studentCount = 0;

  try {
    vacancies = await db.vacancy.findMany({
      where: { status: "OPEN", isPublic: true },
      include: { school: { select: { name: true, countryCode: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    schoolCount = await db.school.count({ where: { isActive: true } });
    teacherCount = await db.teacher.count();
    studentCount = await db.student.count();
  } catch (e) {}

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-brand-600">GDA School</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#vacancies" className="hover:text-brand-600 transition-colors">Job Board</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors px-4 py-2">Sign In</Link>
            <Link href="/register/principal" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-50/30" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3 h-3" /> Global Digital Academy — Education Without Borders
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              The Future of <span className="text-brand-600">Digital Education</span> Starts Here
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              A complete school management platform with virtual classrooms, automated grading, certificate verification, and 3 daily learning sessions across all time zones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/principal" className="btn-primary px-8 py-3.5 text-base">
                <Shield className="w-4 h-4 mr-2" /> Register Your School
              </Link>
              <Link href="/register/teacher" className="btn-ghost px-8 py-3.5 text-base border border-gray-300">
                <Users className="w-4 h-4 mr-2" /> Join as Teacher
              </Link>
              <Link href="/register/student" className="btn-ghost px-8 py-3.5 text-base border border-gray-300">
                <BookOpen className="w-4 h-4 mr-2" /> Enroll as Student
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16">
            {[
              { value: schoolCount, label: "Schools" },
              { value: teacherCount, label: "Teachers" },
              { value: studentCount, label: "Students" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-brand-600">{stat.value}+</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything Your School Needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">One platform for principals, teachers, and students — with built-in interviews, hiring, and credential verification.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Principal Dashboard", desc: "Full school management — approve students, hire teachers, set fees, manage curriculum, schedule interviews, and post vacancies." },
              { icon: Briefcase, title: "Vacancy & Hiring System", desc: "Post job openings visible on the public job board. Review applications, schedule interviews, score candidates, and hire — all in one place." },
              { icon: Users, title: "Interview System", desc: "Schedule interviews for students and teachers. Score on communication, knowledge, attitude. Submit results for principal review." },
              { icon: Video, title: "Virtual Classrooms", desc: "3 daily sessions (Morning, Afternoon, Evening) so students in any time zone can attend. Built-in video, materials, and attendance." },
              { icon: BookOpen, title: "Smart Gradebook", desc: "Create assessments, enter scores, auto-calculate grades. Students see results instantly with detailed feedback." },
              { icon: Star, title: "Blockchain Certificates", desc: "Tamper-proof certificates with unique verification codes. Employers can verify credentials instantly via QR code." },
              { icon: Globe, title: "Multi-Country Support", desc: "Localized curriculum, 17+ countries, local currencies and payment methods. Built for schools worldwide." },
              { icon: DollarSign, title: "Fee Management", desc: "Set fee structures per grade per term. Track payments and generate financial reports." },
              { icon: CheckCircle, title: "Approval Workflows", desc: "Students apply → interview → principal approves. Teachers request → interview → principal hires. Full audit trail." },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Principal Creates School", desc: "Register, set up curriculum, grade levels, fees, and post teaching vacancies. Your school is live in minutes." },
              { step: "2", title: "Teachers & Students Apply", desc: "Teachers apply via the job board or register directly. Students pick a school. Both go through interviews before approval." },
              { step: "3", title: "Learning Begins", desc: "Approved teachers create classes, upload materials, mark attendance, and grade assessments. Students attend virtual sessions." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vacancies / Job Board */}
      <section id="vacancies" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Open Teaching Positions</h2>
              <p className="text-gray-500">Schools are hiring — apply directly, no account needed.</p>
            </div>
            <Link href="/vacancies" className="btn-primary text-sm">
              View All Jobs <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {vacancies.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vacancies.map((v: any) => (
                <Link key={v.id} href="/vacancies" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                      {v.school.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{v.title}</h3>
                      <p className="text-xs text-brand-600">{v.school.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{v.description}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {v.school.countryCode}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {v.employmentType?.replace("_", " ")}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {v._count.applications} applied</span>
                    {v.salaryMin > 0 && <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" /> {v.currency} {v.salaryMin.toLocaleString()}</span>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No open positions yet. Schools will post vacancies here.</p>
              <p className="text-sm text-gray-400 mt-1">Are you a principal? <Link href="/register/principal" className="text-brand-600 hover:underline">Register your school</Link> and start hiring.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your School?</h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">Join the growing network of schools, teachers, and students building the future of education.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/principal" className="btn-primary px-10 py-4 text-base">Register as Principal</Link>
            <Link href="/register/teacher" className="btn-ghost px-10 py-4 text-base border border-gray-300">Register as Teacher</Link>
            <Link href="/register/student" className="btn-ghost px-10 py-4 text-base border border-gray-300">Enroll as Student</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">GDA School</span>
              </div>
              <p className="text-sm">Global Digital Academy — quality education for everyone, everywhere.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link href="/register/principal" className="block hover:text-white">For Schools</Link>
                <Link href="/register/teacher" className="block hover:text-white">For Teachers</Link>
                <Link href="/register/student" className="block hover:text-white">For Students</Link>
                <Link href="/vacancies" className="block hover:text-white">Job Board</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Features</h4>
              <div className="space-y-2 text-sm">
                <span className="block">Virtual Classrooms</span>
                <span className="block">Interview System</span>
                <span className="block">Smart Gradebook</span>
                <span className="block">Certificate Verification</span>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
              <div className="space-y-2 text-sm">
                <span className="block">help@gdaschools.sbs</span>
                <span className="block">17+ Countries Supported</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-sm text-center">
            &copy; {new Date().getFullYear()} GDA School. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}