import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Parent Portal — Monitor Your Child's Education | GDA Schools",
  description: "See your child's attendance, grades, fees, timetable, report cards and chat with teachers in real time. GDA Schools parent portal — know exactly what's happening at school.",
  keywords: ["parent portal school", "monitor child education", "school app for parents", "GDA Schools parent"],
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
