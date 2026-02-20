// Time formatting utilities for consistent AM/PM display across the app

/**
 * Convert "HH:MM" (24h) to "h:MM AM/PM" (12h)
 * e.g. "08:30" → "8:30 AM", "14:00" → "2:00 PM", "00:15" → "12:15 AM"
 */
export function to12h(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

/**
 * Convert "HH:MM" to total minutes since midnight
 */
export function toMinutes(time24: string): number {
  if (!time24 || !time24.includes(":")) return 0;
  const [h, m] = time24.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Format a time range: "8:30 AM – 9:10 AM"
 */
export function formatRange(start: string, end: string): string {
  return `${to12h(start)} – ${to12h(end)}`;
}

/**
 * Get session label from slot key
 */
export function sessionLabel(slot: string): string {
  if (slot === "SESSION_B") return "PM";
  if (slot === "SESSION_C") return "Eve";
  return "AM";
}

/**
 * Get session full label
 */
export function sessionFullLabel(slot: string): string {
  if (slot === "SESSION_B") return "Afternoon";
  if (slot === "SESSION_C") return "Evening";
  return "Morning";
}

/**
 * Get session badge color classes
 */
export function sessionBadgeColor(slot: string): string {
  if (slot === "SESSION_B") return "bg-blue-500 text-white";
  if (slot === "SESSION_C") return "bg-purple-500 text-white";
  return "bg-amber-500 text-white";
}

/**
 * Common timezone list for schools
 */
export const SCHOOL_TIMEZONES = [
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "Africa/Lagos", label: "Nigeria (GMT+1)" },
  { value: "Africa/Nairobi", label: "Kenya (GMT+3)" },
  { value: "Africa/Accra", label: "Ghana (GMT+0)" },
  { value: "Africa/Johannesburg", label: "South Africa (GMT+2)" },
  { value: "Africa/Dar_es_Salaam", label: "Tanzania (GMT+3)" },
  { value: "Africa/Kampala", label: "Uganda (GMT+3)" },
  { value: "Africa/Douala", label: "Cameroon (GMT+1)" },
  { value: "Africa/Cairo", label: "Egypt (GMT+2)" },
  { value: "Africa/Addis_Ababa", label: "Ethiopia (GMT+3)" },
  { value: "Africa/Kigali", label: "Rwanda (GMT+2)" },
  { value: "Europe/London", label: "UK (GMT+0/+1)" },
  { value: "America/New_York", label: "US Eastern (GMT-5)" },
  { value: "America/Chicago", label: "US Central (GMT-6)" },
  { value: "America/Los_Angeles", label: "US Pacific (GMT-8)" },
  { value: "America/Toronto", label: "Canada Eastern (GMT-5)" },
  { value: "Asia/Kolkata", label: "India (GMT+5:30)" },
  { value: "Asia/Karachi", label: "Pakistan (GMT+5)" },
  { value: "Australia/Sydney", label: "Australia (GMT+11)" },
];
