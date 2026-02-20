import type { Metadata } from "next";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Global Digital Academy",
    template: "%s | Global Digital Academy",
  },
  description: "A fully digital online school from Kindergarten to Senior Secondary. Learn from anywhere, anytime.",
  keywords: ["online school", "digital academy", "education", "e-learning", "virtual classroom"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
