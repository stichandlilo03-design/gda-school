"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ====== Link child by email or name ======
export async function linkChildByEmail(email?: string, name?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARENT") return { error: "Unauthorized" };

  const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return { error: "Parent profile not found" };

  if (!email && !name) return { error: "Provide child's email or name" };

  // Search for matching students
  const students = await db.student.findMany({
    where: {
      OR: [
        ...(email ? [{ user: { email: { equals: email.toLowerCase(), mode: "insensitive" as const } } }] : []),
        ...(name ? [{ user: { name: { equals: name, mode: "insensitive" as const } } }] : []),
        // Also check if parentEmail matches parent's email
        { parentEmail: { equals: session.user.email.toLowerCase(), mode: "insensitive" } },
      ],
    },
    include: { user: { select: { name: true, email: true } } },
  });

  if (students.length === 0) {
    return { error: `No student found${email ? ` with email "${email}"` : ""}${name ? ` named "${name}"` : ""}. Make sure they're registered as a student first.` };
  }

  let linkedCount = 0;
  const linkedNames: string[] = [];

  for (const student of students) {
    const existing = await db.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    });
    if (!existing) {
      await db.parentStudent.create({
        data: { parentId: parent.id, studentId: student.id, relation: parent.relationship || "Parent" },
      });
      linkedCount++;
      linkedNames.push(student.user.name);
    }
  }

  if (linkedCount === 0) {
    return { error: "This child is already linked to your account." };
  }

  revalidatePath("/parent");
  revalidatePath("/parent/children");
  return { success: true, message: `Linked ${linkedCount} child(ren): ${linkedNames.join(", ")}` };
}

// ====== Unlink child ======
export async function unlinkChild(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARENT") return { error: "Unauthorized" };

  const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return { error: "Parent profile not found" };

  await db.parentStudent.deleteMany({
    where: { parentId: parent.id, studentId },
  });

  revalidatePath("/parent");
  revalidatePath("/parent/children");
  return { success: true };
}

// ====== Update parent profile ======
export async function updateParentProfile(data: { phone?: string; occupation?: string; address?: string; relationship?: string }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARENT") return { error: "Unauthorized" };

  await db.parent.update({
    where: { userId: session.user.id },
    data: {
      phone: data.phone,
      occupation: data.occupation,
      address: data.address,
      relationship: data.relationship,
    },
  });

  if (data.phone) {
    await db.user.update({ where: { id: session.user.id }, data: { phone: data.phone } });
  }

  revalidatePath("/parent");
  revalidatePath("/parent/profile");
  return { success: true };
}
