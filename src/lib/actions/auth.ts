"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import {
  studentRegisterSchema,
  teacherRegisterSchema,
  principalRegisterSchema,
  parentRegisterSchema,
  type StudentRegisterInput,
  type TeacherRegisterInput,
  type PrincipalRegisterInput,
  type ParentRegisterInput,
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

// ============================================================
// PARENT REGISTRATION
// ============================================================

export async function registerParent(input: ParentRegisterInput) {
  const validated = parentRegisterSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: validated.email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(validated.password, 12);

  // Create user + parent record
  const user = await db.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      password: hashedPassword,
      phone: validated.phone,
      role: "PARENT",
      countryCode: validated.countryCode,
      parent: {
        create: {
          phone: validated.phone,
          occupation: validated.occupation,
          address: validated.address,
          relationship: validated.relationship || "Parent",
        },
      },
    },
    include: { parent: true },
  });

  // Try to link children by matching name + email in Student records
  const linked: string[] = [];
  for (const child of validated.childrenInfo) {
    if (!child.childName) continue;
    
    // Search by name (case-insensitive) and optionally by email
    const students = await db.student.findMany({
    where: {
        OR: [
          { user: { name: { equals: child.childName, mode: "insensitive" as const } } },
          ...(child.childEmail ? [{ user: { email: { equals: child.childEmail.toLowerCase(), mode: "insensitive" as const } } }] : []),
          { parentEmail: { equals: validated.email.toLowerCase(), mode: "insensitive" as const } },
        ],
      },
      include: { user: { select: { name: true } } },
    });

    for (const student of students) {
      // Check if not already linked
      const existingLink = await db.parentStudent.findUnique({
        where: { parentId_studentId: { parentId: user.parent!.id, studentId: student.id } },
      });
      if (!existingLink) {
        await db.parentStudent.create({
          data: {
            parentId: user.parent!.id,
            studentId: student.id,
            relation: validated.relationship || "Parent",
          },
        });
        linked.push(student.user.name);
      }
    }
  }

  // Also auto-link any students whose parentEmail matches this parent's email
  const emailMatches = await db.student.findMany({
    where: { parentEmail: { equals: validated.email.toLowerCase(), mode: "insensitive" as const } },
    include: { user: { select: { name: true } } },
  });
  for (const student of emailMatches) {
    const existingLink = await db.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: user.parent!.id, studentId: student.id } },
    });
    if (!existingLink) {
      await db.parentStudent.create({
        data: { parentId: user.parent!.id, studentId: student.id, relation: validated.relationship || "Parent" },
      });
      if (!linked.includes(student.user.name)) linked.push(student.user.name);
    }
  }

  return { 
    success: true, 
    userId: user.id, 
    linkedChildren: linked,
    message: linked.length > 0 
      ? `Account created! Found and linked ${linked.length} child(ren): ${linked.join(", ")}`
      : "Account created! You can link your children from the dashboard.",
  };
}
