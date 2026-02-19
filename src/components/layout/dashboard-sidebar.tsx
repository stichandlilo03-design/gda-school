"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap, LayoutDashboard, BookOpen, Users, Calendar, Award, Settings,
  LogOut, Bell, ClipboardList, BarChart3, DollarSign,
  UserCheck, BookMarked, FolderOpen, Clock, Menu, X, Star, Shield,
} from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

// Icon map - resolves string names to components
const iconMap: Record<string, any> = {
  LayoutDashboard, BookOpen, Users, Calendar, Award, Settings,
  ClipboardList, BarChart3, DollarSign, UserCheck, BookMarked,
  FolderOpen, Clock, Star, Shield, GraduationCap,
};

interface SidebarLink {
  href: string;
  icon: string; // Now a string name, not a component
  label: string;
}

interface DashboardSidebarProps {
  user: { name: string; email: string; role: string; image?: string };
  links: SidebarLink[];
  schoolName?: string;
}

export default function DashboardSidebar({ user, links, schoolName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-700",
    TEACHER: "bg-emerald-100 text-emerald-700",
    PRINCIPAL: "bg-amber-100 text-amber-700",
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-brand-600 block leading-tight">GDA</span>
            {schoolName && <span className="text-[10px] text-gray-400 leading-none">{schoolName}</span>}
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const IconComponent = iconMap[link.icon] || LayoutDashboard;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-50 text-brand-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <IconComponent className={cn("w-[18px] h-[18px]", isActive ? "text-brand-600" : "text-gray-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
            {user.image ? (
              <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", roleColors[user.role] || "bg-gray-100 text-gray-600")}>
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-0 left-0 z-40 h-full w-72 bg-white shadow-xl transform transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30">
        {sidebar}
      </aside>
    </>
  );
}
