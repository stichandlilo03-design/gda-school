"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateSlug } from "@/lib/utils";

// ============================================================
// REGISTER STUDENT — picks school, status = PENDING
// ============================================================
export async function registerStudent(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  countryCode: string;
  gradeLevel: string;
  preferredSession: string;
  dateOfBirth?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  schoolId: string;
}) {
  try {
    const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return { error: "Email already registered" };

    const school = await db.school.findUnique({ where: { id: data.schoolId } });
    if (!school) return { error: "Selected school not found" };

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        phone: data.phone || null,
        role: "STUDENT",
        countryCode: data.countryCode,
      },
    });

    await db.student.create({
      data: {
        userId: user.id,
        schoolId: data.schoolId,
        gradeLevel: data.gradeLevel as any,
        preferredSession: (data.preferredSession as any) || "SESSION_A",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        parentName: data.parentName || null,
        parentEmail: data.parentEmail || null,
        parentPhone: data.parentPhone || null,
        approvalStatus: "PENDING",
      },
    });

    return { success: true, message: "Registration submitted! Your application is pending approval by the school principal." };
  } catch (error: any) {
    return { error: error.message || "Registration failed" };
  }
}

// ============================================================
// REGISTER TEACHER — subjects, grades, optional school
// ============================================================
export async function registerTeacher(data: {
  name: string;
  email: string;
  password: string;
  countryCode: string;
  bio: string;
  yearsExperience: number;
  teachingStyle: string;
  qualifications: string[];
  subjects?: string[];
  preferredGrades?: string[];
  schoolId?: string;
}) {
  try {
    const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return { error: "Email already registered" };

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: "TEACHER",
        countryCode: data.countryCode,
      },
    });

    const teacher = await db.teacher.create({
      data: {
        userId: user.id,
        bio: data.bio,
        yearsExperience: data.yearsExperience,
        teachingStyle: data.teachingStyle,
        qualifications: data.qualifications,
        subjects: data.subjects || [],
        preferredGrades: data.preferredGrades || [],
      },
    });

    if (data.schoolId) {
      const school = await db.school.findUnique({ where: { id: data.schoolId } });
      if (school) {
        await db.schoolTeacher.create({
          data: {
            teacherId: teacher.id,
            schoolId: data.schoolId,
            status: "PENDING",
            requestedBy: "TEACHER",
            subjectsAppliedFor: data.subjects || [],
          },
        });
      }
    }

    return {
      success: true,
      message: data.schoolId
        ? "Registration complete! Your request to join the school is pending principal approval."
        : "Registration complete! You can now request to join a school from your dashboard.",
    };
  } catch (error: any) {
    return { error: error.message || "Registration failed" };
  }
}

// ============================================================
// REGISTER PRINCIPAL — creates school
// ============================================================
export async function registerPrincipal(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  countryCode: string;
  schoolName: string;
  schoolMotto?: string;
}) {
  try {
    const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return { error: "Email already registered" };

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const currencyMap: Record<string, string> = {
      NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR", US: "USD", GB: "GBP",
      CA: "CAD", AU: "AUD", IN: "INR", EG: "EGP", TZ: "TZS", UG: "UGX",
      ET: "ETB", CM: "XAF", SN: "XOF", RW: "RWF", ZM: "ZMW",
    };

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        phone: data.phone || null,
        role: "PRINCIPAL",
        countryCode: data.countryCode,
      },
    });

    const slug = generateSlug(data.schoolName);

    const school = await db.school.create({
      data: {
        name: data.schoolName,
        slug,
        motto: data.schoolMotto || null,
        countryCode: data.countryCode,
        currency: currencyMap[data.countryCode] || "USD",
      },
    });

    await db.principal.create({
      data: { userId: user.id, schoolId: school.id },
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Registration failed" };
  }
}
