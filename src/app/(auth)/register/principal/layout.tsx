import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Register Your School — GDA Schools",
  description: "Take your school digital with GDA Schools. Manage enrollment, fees, payroll, timetables, live sessions, grades, and reports — all from one dashboard. Built for K1-G12 schools in Africa.",
  keywords: ["school management software", "digital school Africa", "school ERP", "register school online"],
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
