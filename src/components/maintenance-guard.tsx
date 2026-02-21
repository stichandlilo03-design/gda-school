"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; reason: string } | null>(null);
  const pathname = usePathname();

  // Don't block the admin panel
  const isAdmin = pathname?.startsWith("/gda-nerve-center");

  useEffect(() => {
    if (isAdmin) return;
    fetch("/api/maintenance").then(r => r.json()).then(setMaintenance).catch(() => setMaintenance({ enabled: false, reason: "" }));
  }, [pathname, isAdmin]);

  if (isAdmin || !maintenance?.enabled) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
        <p className="text-gray-400 mb-6">{maintenance.reason || "We are performing scheduled maintenance. Please check back soon."}</p>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-500">GDA Schools will be back shortly.</p>
          <p className="text-xs text-gray-600 mt-2">www.gdaschools.sbs</p>
        </div>
      </div>
    </div>
  );
}
