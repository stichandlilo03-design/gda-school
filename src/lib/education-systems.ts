// Country-specific education system labels and structure
// Internal values: K1, K2, K3, G1-G12 (universal enum)
// Display labels change per country's education system

export interface EducationSystem {
  country: string;
  code: string;
  currency: string;
  flag: string;
  systemName: string;
  ageStart: number;
  levels: {
    section: string;       // e.g. "Pre-Primary", "Primary", "Junior Secondary"
    grades: { value: string; label: string; ageRange: string }[];
  }[];
}

export const EDUCATION_SYSTEMS: Record<string, EducationSystem> = {
  // ========== AFRICA ==========
  NG: {
    country: "Nigeria", code: "NG", currency: "NGN", flag: "🇳🇬",
    systemName: "6-3-3-4 System",
    ageStart: 3,
    levels: [
      { section: "Pre-Primary (Nursery)", grades: [
        { value: "K1", label: "Nursery 1", ageRange: "3-4" },
        { value: "K2", label: "Nursery 2", ageRange: "4-5" },
        { value: "K3", label: "Nursery 3", ageRange: "5-6" },
      ]},
      { section: "Primary School", grades: [
        { value: "G1", label: "Primary 1", ageRange: "6-7" },
        { value: "G2", label: "Primary 2", ageRange: "7-8" },
        { value: "G3", label: "Primary 3", ageRange: "8-9" },
        { value: "G4", label: "Primary 4", ageRange: "9-10" },
        { value: "G5", label: "Primary 5", ageRange: "10-11" },
        { value: "G6", label: "Primary 6", ageRange: "11-12" },
      ]},
      { section: "Junior Secondary School (JSS)", grades: [
        { value: "G7", label: "JSS 1", ageRange: "12-13" },
        { value: "G8", label: "JSS 2", ageRange: "13-14" },
        { value: "G9", label: "JSS 3", ageRange: "14-15" },
      ]},
      { section: "Senior Secondary School (SSS)", grades: [
        { value: "G10", label: "SSS 1", ageRange: "15-16" },
        { value: "G11", label: "SSS 2", ageRange: "16-17" },
        { value: "G12", label: "SSS 3", ageRange: "17-18" },
      ]},
    ],
  },
  KE: {
    country: "Kenya", code: "KE", currency: "KES", flag: "🇰🇪",
    systemName: "2-6-3-3 CBC System",
    ageStart: 4,
    levels: [
      { section: "Pre-Primary (PP)", grades: [
        { value: "K1", label: "PP 1", ageRange: "4-5" },
        { value: "K2", label: "PP 2", ageRange: "5-6" },
        { value: "K3", label: "PP 3 (Reception)", ageRange: "6-7" },
      ]},
      { section: "Primary School", grades: [
        { value: "G1", label: "Class 1 (Grade 1)", ageRange: "6-7" },
        { value: "G2", label: "Class 2 (Grade 2)", ageRange: "7-8" },
        { value: "G3", label: "Class 3 (Grade 3)", ageRange: "8-9" },
        { value: "G4", label: "Class 4 (Grade 4)", ageRange: "9-10" },
        { value: "G5", label: "Class 5 (Grade 5)", ageRange: "10-11" },
        { value: "G6", label: "Class 6 (Grade 6)", ageRange: "11-12" },
      ]},
      { section: "Junior Secondary", grades: [
        { value: "G7", label: "Grade 7 (JSS 1)", ageRange: "12-13" },
        { value: "G8", label: "Grade 8 (JSS 2)", ageRange: "13-14" },
        { value: "G9", label: "Grade 9 (JSS 3)", ageRange: "14-15" },
      ]},
      { section: "Senior Secondary", grades: [
        { value: "G10", label: "Grade 10 (SSS 1)", ageRange: "15-16" },
        { value: "G11", label: "Grade 11 (SSS 2)", ageRange: "16-17" },
        { value: "G12", label: "Grade 12 (SSS 3)", ageRange: "17-18" },
      ]},
    ],
  },
  GH: {
    country: "Ghana", code: "GH", currency: "GHS", flag: "🇬🇭",
    systemName: "2-6-3-3 System",
    ageStart: 4,
    levels: [
      { section: "Kindergarten (KG)", grades: [
        { value: "K1", label: "KG 1", ageRange: "4-5" },
        { value: "K2", label: "KG 2", ageRange: "5-6" },
        { value: "K3", label: "KG 3", ageRange: "6-7" },
      ]},
      { section: "Primary School", grades: [
        { value: "G1", label: "Class 1", ageRange: "6-7" },
        { value: "G2", label: "Class 2", ageRange: "7-8" },
        { value: "G3", label: "Class 3", ageRange: "8-9" },
        { value: "G4", label: "Class 4", ageRange: "9-10" },
        { value: "G5", label: "Class 5", ageRange: "10-11" },
        { value: "G6", label: "Class 6", ageRange: "11-12" },
      ]},
      { section: "Junior High School (JHS)", grades: [
        { value: "G7", label: "JHS 1", ageRange: "12-13" },
        { value: "G8", label: "JHS 2", ageRange: "13-14" },
        { value: "G9", label: "JHS 3", ageRange: "14-15" },
      ]},
      { section: "Senior High School (SHS)", grades: [
        { value: "G10", label: "SHS 1", ageRange: "15-16" },
        { value: "G11", label: "SHS 2", ageRange: "16-17" },
        { value: "G12", label: "SHS 3", ageRange: "17-18" },
      ]},
    ],
  },
  ZA: {
    country: "South Africa", code: "ZA", currency: "ZAR", flag: "🇿🇦",
    systemName: "General Education & Training",
    ageStart: 5,
    levels: [
      { section: "Foundation Phase (Pre)", grades: [
        { value: "K1", label: "Grade R (Reception)", ageRange: "5-6" },
        { value: "K2", label: "Grade RR", ageRange: "4-5" },
        { value: "K3", label: "Pre-Grade R", ageRange: "3-4" },
      ]},
      { section: "Foundation Phase", grades: [
        { value: "G1", label: "Grade 1", ageRange: "6-7" },
        { value: "G2", label: "Grade 2", ageRange: "7-8" },
        { value: "G3", label: "Grade 3", ageRange: "8-9" },
      ]},
      { section: "Intermediate Phase", grades: [
        { value: "G4", label: "Grade 4", ageRange: "9-10" },
        { value: "G5", label: "Grade 5", ageRange: "10-11" },
        { value: "G6", label: "Grade 6", ageRange: "11-12" },
      ]},
      { section: "Senior Phase", grades: [
        { value: "G7", label: "Grade 7", ageRange: "12-13" },
        { value: "G8", label: "Grade 8", ageRange: "13-14" },
        { value: "G9", label: "Grade 9", ageRange: "14-15" },
      ]},
      { section: "FET Phase", grades: [
        { value: "G10", label: "Grade 10", ageRange: "15-16" },
        { value: "G11", label: "Grade 11", ageRange: "16-17" },
        { value: "G12", label: "Grade 12 (Matric)", ageRange: "17-18" },
      ]},
    ],
  },
  TZ: {
    country: "Tanzania", code: "TZ", currency: "TZS", flag: "🇹🇿",
    systemName: "2-7-4-2 System",
    ageStart: 5,
    levels: [
      { section: "Pre-Primary", grades: [
        { value: "K1", label: "Nursery", ageRange: "3-4" },
        { value: "K2", label: "Pre-Primary 1", ageRange: "4-5" },
        { value: "K3", label: "Pre-Primary 2", ageRange: "5-6" },
      ]},
      { section: "Primary (Darasa)", grades: [
        { value: "G1", label: "Standard I", ageRange: "7-8" },
        { value: "G2", label: "Standard II", ageRange: "8-9" },
        { value: "G3", label: "Standard III", ageRange: "9-10" },
        { value: "G4", label: "Standard IV", ageRange: "10-11" },
        { value: "G5", label: "Standard V", ageRange: "11-12" },
        { value: "G6", label: "Standard VI", ageRange: "12-13" },
        { value: "G7", label: "Standard VII", ageRange: "13-14" },
      ]},
      { section: "Secondary (O-Level)", grades: [
        { value: "G8", label: "Form 1", ageRange: "14-15" },
        { value: "G9", label: "Form 2", ageRange: "15-16" },
        { value: "G10", label: "Form 3", ageRange: "16-17" },
        { value: "G11", label: "Form 4", ageRange: "17-18" },
      ]},
      { section: "A-Level", grades: [
        { value: "G12", label: "Form 5/6", ageRange: "18-20" },
      ]},
    ],
  },
  UG: {
    country: "Uganda", code: "UG", currency: "UGX", flag: "🇺🇬",
    systemName: "7-4-2 System",
    ageStart: 3,
    levels: [
      { section: "Nursery", grades: [
        { value: "K1", label: "Baby Class", ageRange: "3-4" },
        { value: "K2", label: "Middle Class", ageRange: "4-5" },
        { value: "K3", label: "Top Class", ageRange: "5-6" },
      ]},
      { section: "Primary", grades: [
        { value: "G1", label: "P.1", ageRange: "6-7" },
        { value: "G2", label: "P.2", ageRange: "7-8" },
        { value: "G3", label: "P.3", ageRange: "8-9" },
        { value: "G4", label: "P.4", ageRange: "9-10" },
        { value: "G5", label: "P.5", ageRange: "10-11" },
        { value: "G6", label: "P.6", ageRange: "11-12" },
        { value: "G7", label: "P.7", ageRange: "12-13" },
      ]},
      { section: "O-Level Secondary", grades: [
        { value: "G8", label: "S.1", ageRange: "13-14" },
        { value: "G9", label: "S.2", ageRange: "14-15" },
        { value: "G10", label: "S.3", ageRange: "15-16" },
        { value: "G11", label: "S.4", ageRange: "16-17" },
      ]},
      { section: "A-Level Secondary", grades: [
        { value: "G12", label: "S.5/S.6", ageRange: "17-19" },
      ]},
    ],
  },
  CM: {
    country: "Cameroon", code: "CM", currency: "XAF", flag: "🇨🇲",
    systemName: "Francophone/Anglophone",
    ageStart: 4,
    levels: [
      { section: "Nursery", grades: [
        { value: "K1", label: "Nursery 1", ageRange: "4-5" },
        { value: "K2", label: "Nursery 2", ageRange: "5-6" },
        { value: "K3", label: "Nursery 3", ageRange: "6-7" },
      ]},
      { section: "Primary", grades: [
        { value: "G1", label: "Class 1", ageRange: "6-7" },
        { value: "G2", label: "Class 2", ageRange: "7-8" },
        { value: "G3", label: "Class 3", ageRange: "8-9" },
        { value: "G4", label: "Class 4", ageRange: "9-10" },
        { value: "G5", label: "Class 5", ageRange: "10-11" },
        { value: "G6", label: "Class 6", ageRange: "11-12" },
      ]},
      { section: "Secondary (O-Level)", grades: [
        { value: "G7", label: "Form 1", ageRange: "12-13" },
        { value: "G8", label: "Form 2", ageRange: "13-14" },
        { value: "G9", label: "Form 3", ageRange: "14-15" },
        { value: "G10", label: "Form 4", ageRange: "15-16" },
        { value: "G11", label: "Form 5 (O-Level)", ageRange: "16-17" },
      ]},
      { section: "A-Level", grades: [
        { value: "G12", label: "Lower/Upper 6th", ageRange: "17-19" },
      ]},
    ],
  },
  // ========== EUROPE ==========
  GB: {
    country: "United Kingdom", code: "GB", currency: "GBP", flag: "🇬🇧",
    systemName: "Key Stage System",
    ageStart: 4,
    levels: [
      { section: "Early Years (EYFS)", grades: [
        { value: "K1", label: "Nursery", ageRange: "3-4" },
        { value: "K2", label: "Reception", ageRange: "4-5" },
        { value: "K3", label: "Reception+", ageRange: "4-5" },
      ]},
      { section: "Key Stage 1", grades: [
        { value: "G1", label: "Year 1", ageRange: "5-6" },
        { value: "G2", label: "Year 2", ageRange: "6-7" },
      ]},
      { section: "Key Stage 2", grades: [
        { value: "G3", label: "Year 3", ageRange: "7-8" },
        { value: "G4", label: "Year 4", ageRange: "8-9" },
        { value: "G5", label: "Year 5", ageRange: "9-10" },
        { value: "G6", label: "Year 6", ageRange: "10-11" },
      ]},
      { section: "Key Stage 3", grades: [
        { value: "G7", label: "Year 7", ageRange: "11-12" },
        { value: "G8", label: "Year 8", ageRange: "12-13" },
        { value: "G9", label: "Year 9", ageRange: "13-14" },
      ]},
      { section: "Key Stage 4 (GCSE)", grades: [
        { value: "G10", label: "Year 10", ageRange: "14-15" },
        { value: "G11", label: "Year 11", ageRange: "15-16" },
      ]},
      { section: "Sixth Form (A-Level)", grades: [
        { value: "G12", label: "Year 12/13", ageRange: "16-18" },
      ]},
    ],
  },
  // ========== AMERICAS ==========
  US: {
    country: "United States", code: "US", currency: "USD", flag: "🇺🇸",
    systemName: "K-12 System",
    ageStart: 5,
    levels: [
      { section: "Pre-K / Kindergarten", grades: [
        { value: "K1", label: "Pre-K", ageRange: "3-4" },
        { value: "K2", label: "Pre-K 2", ageRange: "4-5" },
        { value: "K3", label: "Kindergarten", ageRange: "5-6" },
      ]},
      { section: "Elementary School", grades: [
        { value: "G1", label: "1st Grade", ageRange: "6-7" },
        { value: "G2", label: "2nd Grade", ageRange: "7-8" },
        { value: "G3", label: "3rd Grade", ageRange: "8-9" },
        { value: "G4", label: "4th Grade", ageRange: "9-10" },
        { value: "G5", label: "5th Grade", ageRange: "10-11" },
      ]},
      { section: "Middle School", grades: [
        { value: "G6", label: "6th Grade", ageRange: "11-12" },
        { value: "G7", label: "7th Grade", ageRange: "12-13" },
        { value: "G8", label: "8th Grade", ageRange: "13-14" },
      ]},
      { section: "High School", grades: [
        { value: "G9", label: "9th Grade (Freshman)", ageRange: "14-15" },
        { value: "G10", label: "10th Grade (Sophomore)", ageRange: "15-16" },
        { value: "G11", label: "11th Grade (Junior)", ageRange: "16-17" },
        { value: "G12", label: "12th Grade (Senior)", ageRange: "17-18" },
      ]},
    ],
  },
  CA: {
    country: "Canada", code: "CA", currency: "CAD", flag: "🇨🇦",
    systemName: "Provincial System",
    ageStart: 5,
    levels: [
      { section: "Pre-School", grades: [
        { value: "K1", label: "Junior Kindergarten", ageRange: "3-4" },
        { value: "K2", label: "Senior Kindergarten", ageRange: "4-5" },
        { value: "K3", label: "Kindergarten", ageRange: "5-6" },
      ]},
      { section: "Elementary", grades: [
        { value: "G1", label: "Grade 1", ageRange: "6-7" },
        { value: "G2", label: "Grade 2", ageRange: "7-8" },
        { value: "G3", label: "Grade 3", ageRange: "8-9" },
        { value: "G4", label: "Grade 4", ageRange: "9-10" },
        { value: "G5", label: "Grade 5", ageRange: "10-11" },
        { value: "G6", label: "Grade 6", ageRange: "11-12" },
      ]},
      { section: "Middle / Intermediate", grades: [
        { value: "G7", label: "Grade 7", ageRange: "12-13" },
        { value: "G8", label: "Grade 8", ageRange: "13-14" },
        { value: "G9", label: "Grade 9", ageRange: "14-15" },
      ]},
      { section: "Secondary", grades: [
        { value: "G10", label: "Grade 10", ageRange: "15-16" },
        { value: "G11", label: "Grade 11", ageRange: "16-17" },
        { value: "G12", label: "Grade 12", ageRange: "17-18" },
      ]},
    ],
  },
  // ========== ASIA / OCEANIA ==========
  IN: {
    country: "India", code: "IN", currency: "INR", flag: "🇮🇳",
    systemName: "10+2 System",
    ageStart: 3,
    levels: [
      { section: "Pre-Primary", grades: [
        { value: "K1", label: "Nursery (LKG)", ageRange: "3-4" },
        { value: "K2", label: "Lower KG (LKG)", ageRange: "4-5" },
        { value: "K3", label: "Upper KG (UKG)", ageRange: "5-6" },
      ]},
      { section: "Primary", grades: [
        { value: "G1", label: "Class I", ageRange: "6-7" },
        { value: "G2", label: "Class II", ageRange: "7-8" },
        { value: "G3", label: "Class III", ageRange: "8-9" },
        { value: "G4", label: "Class IV", ageRange: "9-10" },
        { value: "G5", label: "Class V", ageRange: "10-11" },
      ]},
      { section: "Upper Primary", grades: [
        { value: "G6", label: "Class VI", ageRange: "11-12" },
        { value: "G7", label: "Class VII", ageRange: "12-13" },
        { value: "G8", label: "Class VIII", ageRange: "13-14" },
      ]},
      { section: "Secondary", grades: [
        { value: "G9", label: "Class IX", ageRange: "14-15" },
        { value: "G10", label: "Class X (Board)", ageRange: "15-16" },
      ]},
      { section: "Senior Secondary (+2)", grades: [
        { value: "G11", label: "Class XI", ageRange: "16-17" },
        { value: "G12", label: "Class XII (Board)", ageRange: "17-18" },
      ]},
    ],
  },
  AU: {
    country: "Australia", code: "AU", currency: "AUD", flag: "🇦🇺",
    systemName: "K-12 System",
    ageStart: 5,
    levels: [
      { section: "Pre-School", grades: [
        { value: "K1", label: "Pre-Kindy", ageRange: "3-4" },
        { value: "K2", label: "Kindy", ageRange: "4-5" },
        { value: "K3", label: "Prep/Foundation", ageRange: "5-6" },
      ]},
      { section: "Primary", grades: [
        { value: "G1", label: "Year 1", ageRange: "6-7" },
        { value: "G2", label: "Year 2", ageRange: "7-8" },
        { value: "G3", label: "Year 3", ageRange: "8-9" },
        { value: "G4", label: "Year 4", ageRange: "9-10" },
        { value: "G5", label: "Year 5", ageRange: "10-11" },
        { value: "G6", label: "Year 6", ageRange: "11-12" },
      ]},
      { section: "Secondary", grades: [
        { value: "G7", label: "Year 7", ageRange: "12-13" },
        { value: "G8", label: "Year 8", ageRange: "13-14" },
        { value: "G9", label: "Year 9", ageRange: "14-15" },
        { value: "G10", label: "Year 10", ageRange: "15-16" },
      ]},
      { section: "Senior Secondary", grades: [
        { value: "G11", label: "Year 11", ageRange: "16-17" },
        { value: "G12", label: "Year 12 (HSC/VCE)", ageRange: "17-18" },
      ]},
    ],
  },
  PK: {
    country: "Pakistan", code: "PK", currency: "PKR", flag: "🇵🇰",
    systemName: "5-3-2-2 System",
    ageStart: 3,
    levels: [
      { section: "Pre-Primary", grades: [
        { value: "K1", label: "Play Group", ageRange: "3-4" },
        { value: "K2", label: "Nursery", ageRange: "4-5" },
        { value: "K3", label: "Prep (KG)", ageRange: "5-6" },
      ]},
      { section: "Primary", grades: [
        { value: "G1", label: "Class 1", ageRange: "6-7" },
        { value: "G2", label: "Class 2", ageRange: "7-8" },
        { value: "G3", label: "Class 3", ageRange: "8-9" },
        { value: "G4", label: "Class 4", ageRange: "9-10" },
        { value: "G5", label: "Class 5", ageRange: "10-11" },
      ]},
      { section: "Middle", grades: [
        { value: "G6", label: "Class 6", ageRange: "11-12" },
        { value: "G7", label: "Class 7", ageRange: "12-13" },
        { value: "G8", label: "Class 8", ageRange: "13-14" },
      ]},
      { section: "Matric", grades: [
        { value: "G9", label: "Class 9 (Matric I)", ageRange: "14-15" },
        { value: "G10", label: "Class 10 (Matric II)", ageRange: "15-16" },
      ]},
      { section: "Intermediate", grades: [
        { value: "G11", label: "1st Year (FSc/FA)", ageRange: "16-17" },
        { value: "G12", label: "2nd Year (FSc/FA)", ageRange: "17-18" },
      ]},
    ],
  },
};

// Fallback for unlisted countries
const DEFAULT_SYSTEM: EducationSystem = {
  country: "International", code: "INT", currency: "USD", flag: "🌍",
  systemName: "Standard System",
  ageStart: 5,
  levels: [
    { section: "Pre-School", grades: [
      { value: "K1", label: "Kindergarten 1", ageRange: "3-4" },
      { value: "K2", label: "Kindergarten 2", ageRange: "4-5" },
      { value: "K3", label: "Kindergarten 3", ageRange: "5-6" },
    ]},
    { section: "Primary", grades: [
      { value: "G1", label: "Grade 1", ageRange: "6-7" }, { value: "G2", label: "Grade 2", ageRange: "7-8" },
      { value: "G3", label: "Grade 3", ageRange: "8-9" }, { value: "G4", label: "Grade 4", ageRange: "9-10" },
      { value: "G5", label: "Grade 5", ageRange: "10-11" }, { value: "G6", label: "Grade 6", ageRange: "11-12" },
    ]},
    { section: "Lower Secondary", grades: [
      { value: "G7", label: "Grade 7", ageRange: "12-13" }, { value: "G8", label: "Grade 8", ageRange: "13-14" },
      { value: "G9", label: "Grade 9", ageRange: "14-15" },
    ]},
    { section: "Upper Secondary", grades: [
      { value: "G10", label: "Grade 10", ageRange: "15-16" }, { value: "G11", label: "Grade 11", ageRange: "16-17" },
      { value: "G12", label: "Grade 12", ageRange: "17-18" },
    ]},
  ],
};

// ========== HELPER FUNCTIONS ==========

export function getEducationSystem(countryCode: string): EducationSystem {
  return EDUCATION_SYSTEMS[countryCode] || DEFAULT_SYSTEM;
}

export function getGradeLabelForCountry(gradeValue: string, countryCode: string): string {
  const sys = getEducationSystem(countryCode);
  for (const level of sys.levels) {
    const grade = level.grades.find(g => g.value === gradeValue);
    if (grade) return grade.label;
  }
  return gradeValue;
}

export function getGradeSectionForCountry(gradeValue: string, countryCode: string): string {
  const sys = getEducationSystem(countryCode);
  for (const level of sys.levels) {
    if (level.grades.find(g => g.value === gradeValue)) return level.section;
  }
  return "Other";
}

export function getAllGradesFlat(countryCode: string): { value: string; label: string; section: string; ageRange: string }[] {
  const sys = getEducationSystem(countryCode);
  return sys.levels.flatMap(level =>
    level.grades.map(g => ({ ...g, section: level.section }))
  );
}

export function getAllCountries(): { code: string; name: string; flag: string; currency: string }[] {
  return Object.values(EDUCATION_SYSTEMS).map(s => ({
    code: s.code, name: s.country, flag: s.flag, currency: s.currency,
  }));
}
