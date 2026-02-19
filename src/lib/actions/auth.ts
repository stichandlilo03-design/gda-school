"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import {
  studentRegisterSchema,
  teacherRegisterSchema,
  principalRegisterSchema,
  type StudentRegisterInput,
  type TeacherRegisterInput,
  type PrincipalRegisterInput,
} from "@/lib/validations";

// ============================================================
// STUDENT REGISTRATION
// ============================================================
export async function registerStudent(input: StudentRegisterInput) {
  const validated = studentRegisterSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: validated.email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const school = await db.school.findUnique({ where: { id: validated.schoolId } });
  if (!school) {
    return { error: "School not found" };
  }

  const hashedPassword = await bcrypt.hash(validated.password, 12);

  const user = await db.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      password: hashedPassword,
      phone: validated.phone,
      role: "STUDENT",
      countryCode: validated.countryCode,
      student: {
        create: {
          schoolId: validated.schoolId,
          gradeLevel: validated.gradeLevel as any,
          parentName: validated.parentName,
          parentEmail: validated.parentEmail || null,
          parentPhone: validated.parentPhone,
          dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
          preferredSession: validated.preferredSession as any,
        },
      },
    },
  });

  return { success: true, userId: user.id };
}

// ============================================================
// TEACHER REGISTRATION
// ============================================================
export async function registerTeacher(input: TeacherRegisterInput) {
  const validated = teacherRegisterSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: validated.email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(validated.password, 12);

  const user = await db.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      password: hashedPassword,
      phone: validated.phone,
      role: "TEACHER",
      countryCode: validated.countryCode,
      teacher: {
        create: {
          bio: validated.bio,
          yearsExperience: validated.yearsExperience,
          teachingStyle: validated.teachingStyle,
          qualifications: validated.qualifications,
        },
      },
    },
  });

  return { success: true, userId: user.id };
}

// ============================================================
// PRINCIPAL REGISTRATION (creates school + principal)
// ============================================================
export async function registerPrincipal(input: PrincipalRegisterInput) {
  const validated = principalRegisterSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: validated.email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(validated.password, 12);
  const slug = generateSlug(validated.schoolName) + "-" + Date.now().toString(36);

  const user = await db.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      password: hashedPassword,
      phone: validated.phone,
      role: "PRINCIPAL",
      countryCode: validated.countryCode,
    },
  });

  const school = await db.school.create({
    data: {
      name: validated.schoolName,
      slug,
      countryCode: validated.countryCode,
      currency: validated.currency,
      motto: validated.schoolMotto,
      principal: {
        create: {
          userId: user.id,
        },
      },
    },
  });

  return { success: true, userId: user.id, schoolId: school.id };
}
