"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import MaintenanceGuard from "@/components/maintenance-guard";

export default function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider><MaintenanceGuard>{children}</MaintenanceGuard></SessionProvider>;
}
