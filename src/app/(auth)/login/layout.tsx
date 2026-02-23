import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Login — GDA Schools",
  description: "Sign in to your GDA Schools account. Student, teacher, principal, or parent portal.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
