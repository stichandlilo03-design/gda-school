"use client";

import { useEffect } from "react";
import { teacherHeartbeat } from "@/lib/actions/profile";

export default function TeacherHeartbeat() {
  useEffect(() => {
    // Send heartbeat every 2 minutes
    const interval = setInterval(() => {
      teacherHeartbeat();
    }, 120000);

    // Send initial heartbeat
    teacherHeartbeat();

    // When tab closes, we can't reliably set offline
    // The principal/student side checks lastSeenAt instead
    return () => clearInterval(interval);
  }, []);

  return null; // Invisible component
}
