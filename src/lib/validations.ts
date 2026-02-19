import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const studentRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  countryCode: z.string().min(2).max(3),
  gradeLevel: z.string(),
  schoolId: z.string(),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferredSession: z.enum(["SESSION_A", "SESSION_B", "SESSION_C"]).default("SESSION_A"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const teacherRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  countryCode: z.string().min(2).max(3),
  bio: z.string().min(20, "Bio must be at least 20 characters"),
  yearsExperience: z.number().min(0).max(50),
  teachingStyle: z.string().optional(),
  qualifications: z.array(z.string()).min(1, "At least one qualification is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const principalRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  countryCode: z.string().min(2).max(3),
  schoolName: z.string().min(3, "School name must be at least 3 characters"),
  schoolMotto: z.string().optional(),
  currency: z.string().default("USD"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const createClassSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  subjectId: z.string(),
  schoolGradeId: z.string(),
  session: z.enum(["SESSION_A", "SESSION_B", "SESSION_C"]),
  maxStudents: z.number().min(5).max(100).default(40),
});

export const createAssessmentSchema = z.object({
  classId: z.string(),
  termId: z.string().optional(),
  type: z.enum(["CONTINUOUS_ASSESSMENT", "MID_TERM_TEST", "END_OF_TERM_EXAM", "PROJECT"]),
  title: z.string().min(2),
  description: z.string().optional(),
  maxScore: z.number().min(1),
  weight: z.number().min(0).max(100).default(1),
  dueDate: z.string().optional(),
});

export const schoolSettingsSchema = z.object({
  name: z.string().min(3),
  motto: z.string().optional(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  rulesText: z.string().optional(),
  anthemLyrics: z.string().optional(),
});

export const feeStructureSchema = z.object({
  schoolGradeId: z.string(),
  term: z.enum(["TERM_1", "TERM_2", "TERM_3"]),
  tuitionFee: z.number().min(0),
  registrationFee: z.number().min(0).default(0),
  examFee: z.number().min(0).default(0),
  technologyFee: z.number().min(0).default(0),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type TeacherRegisterInput = z.infer<typeof teacherRegisterSchema>;
export type PrincipalRegisterInput = z.infer<typeof principalRegisterSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
