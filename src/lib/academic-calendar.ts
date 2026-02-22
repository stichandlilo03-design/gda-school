// Academic calendar templates by country/region
// Auto-generates term dates, mid-term breaks, holidays, exam periods

export interface CalendarTemplate {
  country: string;
  terms: { name: string; termNumber: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[];
  midTermBreaks: { afterTerm: string; durationWeeks: number }[];
  holidays: { name: string; month: number; day: number; duration: number }[];
  examWeeks: { term: string; weeksBeforeEnd: number }[];
  promotionTerm: string; // Which term is promotion decided
}

const CALENDARS: Record<string, CalendarTemplate> = {
  NG: { // Nigeria: Sept-July, 3 terms
    country: "Nigeria",
    terms: [
      { name: "First Term", termNumber: "TERM_1", startMonth: 9, startDay: 12, endMonth: 12, endDay: 15 },
      { name: "Second Term", termNumber: "TERM_2", startMonth: 1, startDay: 8, endMonth: 4, endDay: 5 },
      { name: "Third Term", termNumber: "TERM_3", startMonth: 4, startDay: 22, endMonth: 7, endDay: 19 },
    ],
    midTermBreaks: [
      { afterTerm: "TERM_1", durationWeeks: 1 },
      { afterTerm: "TERM_2", durationWeeks: 1 },
      { afterTerm: "TERM_3", durationWeeks: 1 },
    ],
    holidays: [
      { name: "Christmas Break", month: 12, day: 16, duration: 21 },
      { name: "Easter Break", month: 4, day: 6, duration: 14 },
      { name: "Independence Day", month: 10, day: 1, duration: 1 },
      { name: "Eid-el-Fitr (approx)", month: 3, day: 30, duration: 2 },
      { name: "Workers Day", month: 5, day: 1, duration: 1 },
      { name: "Democracy Day", month: 6, day: 12, duration: 1 },
      { name: "Long Vacation", month: 7, day: 20, duration: 50 },
    ],
    examWeeks: [
      { term: "TERM_1", weeksBeforeEnd: 2 },
      { term: "TERM_2", weeksBeforeEnd: 2 },
      { term: "TERM_3", weeksBeforeEnd: 3 },
    ],
    promotionTerm: "TERM_3",
  },
  KE: { // Kenya CBC: Jan-Nov, 3 terms
    country: "Kenya",
    terms: [
      { name: "Term 1", termNumber: "TERM_1", startMonth: 1, startDay: 6, endMonth: 3, endDay: 29 },
      { name: "Term 2", termNumber: "TERM_2", startMonth: 5, startDay: 6, endMonth: 8, endDay: 2 },
      { name: "Term 3", termNumber: "TERM_3", startMonth: 8, startDay: 26, endMonth: 11, endDay: 1 },
    ],
    midTermBreaks: [
      { afterTerm: "TERM_1", durationWeeks: 1 },
      { afterTerm: "TERM_2", durationWeeks: 1 },
      { afterTerm: "TERM_3", durationWeeks: 1 },
    ],
    holidays: [
      { name: "April Holiday", month: 3, day: 30, duration: 35 },
      { name: "August Holiday", month: 8, day: 3, duration: 21 },
      { name: "December Holiday", month: 11, day: 2, duration: 60 },
      { name: "Jamhuri Day", month: 12, day: 12, duration: 1 },
      { name: "Mashujaa Day", month: 10, day: 20, duration: 1 },
      { name: "Madaraka Day", month: 6, day: 1, duration: 1 },
    ],
    examWeeks: [
      { term: "TERM_1", weeksBeforeEnd: 2 },
      { term: "TERM_2", weeksBeforeEnd: 2 },
      { term: "TERM_3", weeksBeforeEnd: 3 },
    ],
    promotionTerm: "TERM_3",
  },
  GH: { // Ghana: Sept-July
    country: "Ghana",
    terms: [
      { name: "Term 1", termNumber: "TERM_1", startMonth: 9, startDay: 5, endMonth: 12, endDay: 17 },
      { name: "Term 2", termNumber: "TERM_2", startMonth: 1, startDay: 10, endMonth: 4, endDay: 7 },
      { name: "Term 3", termNumber: "TERM_3", startMonth: 5, startDay: 2, endMonth: 7, endDay: 28 },
    ],
    midTermBreaks: [{ afterTerm: "TERM_1", durationWeeks: 1 }, { afterTerm: "TERM_2", durationWeeks: 1 }],
    holidays: [
      { name: "Christmas Break", month: 12, day: 18, duration: 21 },
      { name: "Easter Break", month: 4, day: 8, duration: 14 },
      { name: "Independence Day", month: 3, day: 6, duration: 1 },
      { name: "Long Vacation", month: 7, day: 29, duration: 35 },
    ],
    examWeeks: [{ term: "TERM_1", weeksBeforeEnd: 2 }, { term: "TERM_2", weeksBeforeEnd: 2 }, { term: "TERM_3", weeksBeforeEnd: 3 }],
    promotionTerm: "TERM_3",
  },
  ZA: { // South Africa: Jan-Dec, 4 terms
    country: "South Africa",
    terms: [
      { name: "Term 1", termNumber: "TERM_1", startMonth: 1, startDay: 15, endMonth: 3, endDay: 22 },
      { name: "Term 2", termNumber: "TERM_2", startMonth: 4, startDay: 9, endMonth: 6, endDay: 21 },
      { name: "Term 3", termNumber: "TERM_3", startMonth: 7, startDay: 15, endMonth: 9, endDay: 27 },
    ],
    midTermBreaks: [{ afterTerm: "TERM_1", durationWeeks: 2 }, { afterTerm: "TERM_2", durationWeeks: 3 }],
    holidays: [
      { name: "March Holiday", month: 3, day: 23, duration: 14 },
      { name: "June Holiday", month: 6, day: 22, duration: 21 },
      { name: "September Holiday", month: 9, day: 28, duration: 14 },
      { name: "December Holiday", month: 12, day: 10, duration: 35 },
      { name: "Heritage Day", month: 9, day: 24, duration: 1 },
      { name: "Youth Day", month: 6, day: 16, duration: 1 },
    ],
    examWeeks: [{ term: "TERM_1", weeksBeforeEnd: 2 }, { term: "TERM_2", weeksBeforeEnd: 2 }, { term: "TERM_3", weeksBeforeEnd: 3 }],
    promotionTerm: "TERM_3",
  },
  GB: { // UK: Sept-July, 3 terms
    country: "United Kingdom",
    terms: [
      { name: "Autumn Term", termNumber: "TERM_1", startMonth: 9, startDay: 4, endMonth: 12, endDay: 20 },
      { name: "Spring Term", termNumber: "TERM_2", startMonth: 1, startDay: 8, endMonth: 3, endDay: 28 },
      { name: "Summer Term", termNumber: "TERM_3", startMonth: 4, startDay: 15, endMonth: 7, endDay: 19 },
    ],
    midTermBreaks: [
      { afterTerm: "TERM_1", durationWeeks: 1 },
      { afterTerm: "TERM_2", durationWeeks: 1 },
      { afterTerm: "TERM_3", durationWeeks: 1 },
    ],
    holidays: [
      { name: "Christmas Holiday", month: 12, day: 21, duration: 16 },
      { name: "Easter Holiday", month: 3, day: 29, duration: 14 },
      { name: "Summer Holiday", month: 7, day: 20, duration: 42 },
      { name: "October Half-term", month: 10, day: 21, duration: 7 },
      { name: "February Half-term", month: 2, day: 17, duration: 7 },
      { name: "May Half-term", month: 5, day: 26, duration: 7 },
    ],
    examWeeks: [{ term: "TERM_1", weeksBeforeEnd: 2 }, { term: "TERM_2", weeksBeforeEnd: 2 }, { term: "TERM_3", weeksBeforeEnd: 3 }],
    promotionTerm: "TERM_3",
  },
  US: { // USA: Aug-June, 2 semesters mapped to 3 terms
    country: "United States",
    terms: [
      { name: "Fall Semester", termNumber: "TERM_1", startMonth: 8, startDay: 19, endMonth: 12, endDay: 20 },
      { name: "Spring Semester", termNumber: "TERM_2", startMonth: 1, startDay: 6, endMonth: 3, endDay: 14 },
      { name: "Spring (continued)", termNumber: "TERM_3", startMonth: 3, startDay: 24, endMonth: 6, endDay: 6 },
    ],
    midTermBreaks: [{ afterTerm: "TERM_1", durationWeeks: 1 }, { afterTerm: "TERM_2", durationWeeks: 1 }],
    holidays: [
      { name: "Winter Break", month: 12, day: 21, duration: 14 },
      { name: "Spring Break", month: 3, day: 15, duration: 7 },
      { name: "Summer Break", month: 6, day: 7, duration: 70 },
      { name: "Thanksgiving", month: 11, day: 25, duration: 5 },
      { name: "MLK Day", month: 1, day: 20, duration: 1 },
      { name: "Memorial Day", month: 5, day: 26, duration: 1 },
      { name: "Labor Day", month: 9, day: 1, duration: 1 },
    ],
    examWeeks: [{ term: "TERM_1", weeksBeforeEnd: 1 }, { term: "TERM_3", weeksBeforeEnd: 2 }],
    promotionTerm: "TERM_3",
  },
  IN: { // India: Apr-Mar
    country: "India",
    terms: [
      { name: "Term 1", termNumber: "TERM_1", startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
      { name: "Term 2", termNumber: "TERM_2", startMonth: 10, startDay: 14, endMonth: 12, endDay: 23 },
      { name: "Term 3", termNumber: "TERM_3", startMonth: 1, startDay: 6, endMonth: 3, endDay: 20 },
    ],
    midTermBreaks: [{ afterTerm: "TERM_1", durationWeeks: 2 }],
    holidays: [
      { name: "Summer Vacation", month: 5, day: 15, duration: 42 },
      { name: "Dussehra", month: 10, day: 1, duration: 12 },
      { name: "Diwali Break", month: 11, day: 1, duration: 7 },
      { name: "Christmas Break", month: 12, day: 24, duration: 10 },
      { name: "Republic Day", month: 1, day: 26, duration: 1 },
      { name: "Independence Day", month: 8, day: 15, duration: 1 },
      { name: "Gandhi Jayanti", month: 10, day: 2, duration: 1 },
    ],
    examWeeks: [{ term: "TERM_1", weeksBeforeEnd: 2 }, { term: "TERM_2", weeksBeforeEnd: 2 }, { term: "TERM_3", weeksBeforeEnd: 3 }],
    promotionTerm: "TERM_3",
  },
};

// Default for countries not explicitly defined
const DEFAULT_CALENDAR: CalendarTemplate = CALENDARS.NG;

export function getCalendarTemplate(countryCode: string): CalendarTemplate {
  return CALENDARS[countryCode] || DEFAULT_CALENDAR;
}

export function generateEventsForYear(countryCode: string, year: number) {
  const template = getCalendarTemplate(countryCode);
  const events: {
    title: string; description?: string; eventType: string;
    startDate: Date; endDate: Date; termNumber?: string;
  }[] = [];

  // Generate terms
  template.terms.forEach(t => {
    const startYear = t.startMonth >= 8 ? year : year + 1; // Handle Sept-start calendars
    const endYear = t.endMonth <= t.startMonth && t.startMonth >= 8 ? year + 1 : startYear;
    
    const start = new Date(startYear, t.startMonth - 1, t.startDay);
    const end = new Date(endYear, t.endMonth - 1, t.endDay);

    events.push({
      title: `${t.name} Starts`, eventType: "TERM_START",
      startDate: start, endDate: start, termNumber: t.termNumber,
    });
    events.push({
      title: `${t.name} Ends`, eventType: "TERM_END",
      startDate: end, endDate: end, termNumber: t.termNumber,
    });

    // Midterm break (approx middle of term)
    const midBreak = template.midTermBreaks.find(b => b.afterTerm === t.termNumber);
    if (midBreak) {
      const midDate = new Date((start.getTime() + end.getTime()) / 2);
      const midEnd = new Date(midDate.getTime() + midBreak.durationWeeks * 7 * 24 * 60 * 60 * 1000);
      events.push({
        title: `${t.name} Mid-Term Break`, eventType: "MID_TERM_BREAK",
        startDate: midDate, endDate: midEnd, termNumber: t.termNumber,
      });
    }
  });

  // Exam periods
  template.examWeeks.forEach(e => {
    const term = template.terms.find(t => t.termNumber === e.term);
    if (term) {
      const endYear = term.endMonth <= term.startMonth && term.startMonth >= 8 ? year + 1 : (term.startMonth >= 8 ? year : year + 1);
      const termEnd = new Date(endYear, term.endMonth - 1, term.endDay);
      const examStart = new Date(termEnd.getTime() - e.weeksBeforeEnd * 7 * 24 * 60 * 60 * 1000);
      events.push({
        title: `${term.name} Examinations`, eventType: "EXAM_PERIOD",
        startDate: examStart, endDate: termEnd, termNumber: e.term,
      });
    }
  });

  // Holidays
  template.holidays.forEach(h => {
    const hYear = h.month >= 8 ? year : year + 1;
    const start = new Date(hYear, h.month - 1, h.day);
    const end = new Date(start.getTime() + h.duration * 24 * 60 * 60 * 1000);
    events.push({
      title: h.name, eventType: h.name.includes("Break") || h.name.includes("Vacation") ? "HOLIDAY" : "PUBLIC_HOLIDAY",
      startDate: start, endDate: end,
    });
  });

  // School resumption (day after each holiday > 5 days)
  events.filter(e => e.eventType === "HOLIDAY" && (e.endDate.getTime() - e.startDate.getTime()) > 5 * 86400000).forEach(h => {
    const resumption = new Date(h.endDate.getTime() + 86400000);
    events.push({ title: "School Resumes", eventType: "SCHOOL_RESUMPTION", startDate: resumption, endDate: resumption });
  });

  return events.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());
}

export function getCurrentAcademicPeriod(countryCode: string): {
  currentTerm: string | null;
  isOnBreak: boolean;
  isExamPeriod: boolean;
  isMidTerm: boolean;
  nextEvent: string;
  promotionTerm: string;
} {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // Academic year
  const events = generateEventsForYear(countryCode, year);
  const template = getCalendarTemplate(countryCode);

  let currentTerm: string | null = null;
  let isOnBreak = false;
  let isExamPeriod = false;
  let isMidTerm = false;
  let nextEvent = "Unknown";

  for (const evt of events) {
    if (now >= evt.startDate && now <= evt.endDate) {
      if (evt.eventType === "HOLIDAY" || evt.eventType === "PUBLIC_HOLIDAY") isOnBreak = true;
      if (evt.eventType === "EXAM_PERIOD") isExamPeriod = true;
      if (evt.eventType === "MID_TERM_BREAK") { isMidTerm = true; isOnBreak = true; }
    }
    if (evt.eventType === "TERM_START" && evt.startDate <= now) currentTerm = evt.termNumber || null;
  }

  const future = events.filter(e => e.startDate > now);
  if (future.length > 0) nextEvent = `${future[0].title} (${future[0].startDate.toLocaleDateString()})`;

  return { currentTerm, isOnBreak, isExamPeriod, isMidTerm, nextEvent, promotionTerm: template.promotionTerm };
}

export function getGradeFromScore(score: number): string {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
  if (score >= 30) return "E";
  return "F";
}

export function getGradeRemark(grade: string): string {
  const remarks: Record<string, string> = {
    A: "Excellent", B: "Very Good", C: "Good", D: "Fair", E: "Below Average", F: "Fail",
  };
  return remarks[grade] || "N/A";
}

export function getAllCalendarCountries() {
  return Object.entries(CALENDARS).map(([code, cal]) => ({ code, name: cal.country }));
}
