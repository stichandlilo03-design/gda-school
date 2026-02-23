import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Register as Student — GDA Schools",
  description: "Join GDA Schools as a student. Attend live virtual classes, track your grades, access timetables, play educational games, and learn from anywhere. Schools in Nigeria, Kenya, Ghana, South Africa and 10 more countries.",
  keywords: ["student registration", "join online school", "GDA Schools student", "virtual school Africa"],
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
