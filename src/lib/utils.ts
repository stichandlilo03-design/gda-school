import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getGradeLabelForCountry } from "@/lib/education-systems";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}


export function getGradeLevelLabel(level: string, countryCode?: string): string {
  if (countryCode) {
    return getGradeLabelForCountry(level, countryCode);
  }
  const labels: Record<string, string> = {
    K1: "Kindergarten 1", K2: "Kindergarten 2", K3: "Kindergarten 3",
    G1: "Grade 1", G2: "Grade 2", G3: "Grade 3", G4: "Grade 4",
    G5: "Grade 5", G6: "Grade 6", G7: "Grade 7", G8: "Grade 8",
    G9: "Grade 9", G10: "Grade 10", G11: "Grade 11", G12: "Grade 12",
  };
  return labels[level] || level;
}

export function getSessionLabel(session: string): string {
  const labels: Record<string, string> = {
    SESSION_A: "Morning (06:00–10:00 UTC)",
    SESSION_B: "Afternoon (14:00–18:00 UTC)",
    SESSION_C: "Evening (22:00–02:00 UTC)",
  };
  return labels[session] || session;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
