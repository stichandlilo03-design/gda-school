"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, Settings, Clock, BarChart3, DollarSign,
  ClipboardList, UserCheck, FolderOpen, Award, Calendar, Menu, X, LogOut, Briefcase, Monitor,
  CreditCard, MessageSquare, User
} from "lucide-react";

const iconMap: Record<string, any> = {
  LayoutDashboard, BookOpen, Users, GraduationCap, Settings, Clock, BarChart3, DollarSign,
  ClipboardList, UserCheck, FolderOpen, Award, Calendar, Briefcase, Monitor, CreditCard,
  MessageSquare, User,
};

interface SidebarProps {
  user: { name: string; email: string; role: string; image?: string };
  links: { href: string; icon: string; label: string }[];
  schoolName?: string;
}

export default function DashboardSidebar({ user, links, schoolName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href.split("/").length === 2) return pathname === href;
    return pathname.startsWith(href);
  };

  const roleColors: Record<string, string> = {
    PRINCIPAL: "bg-purple-100 text-purple-700",
    TEACHER: "bg-emerald-100 text-emerald-700",
    STUDENT: "bg-blue-100 text-blue-700",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md">
        <Menu className="w-5 h-5" />
      </button>

      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-brand-600 text-sm">GDA School</span>
                  {schoolName && <p className="text-[10px] text-gray-400 leading-tight">{schoolName}</p>}
                </div>
              </Link>
              <button onClick={() => setOpen(false)} className="lg:hidden p-1"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
            {links.map((link) => {
              const IconComponent = iconMap[link.icon] || LayoutDashboard;
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <IconComponent className={`w-4.5 h-4.5 ${active ? "text-brand-600" : "text-gray-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              {user.image ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200">
                  <img src={user.image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}>
                  {user.role}
                </span>
              </div>
            </div>
            <Link href="/api/auth/signout" className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors px-1">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
