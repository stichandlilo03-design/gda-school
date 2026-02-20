"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ====== TEACHER: Toggle online/offline ======
export async function setTeacherOnlineStatus(isOnline: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };
  await db.teacher.update({
    where: { userId: session.user.id },
    data: { isOnline, lastSeenAt: new Date() },
  });
  revalidatePath("/teacher");
  return { success: true };
}

// ====== TEACHER: Set profile slug for shareable link ======
export async function setProfileSlug(slug: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);
  if (clean.length < 3) return { error: "Slug must be at least 3 characters" };

  const existing = await db.teacher.findFirst({ where: { profileSlug: clean, userId: { not: session.user.id } } });
  if (existing) return { error: "This profile link is already taken" };

  await db.teacher.update({ where: { userId: session.user.id }, data: { profileSlug: clean } });
  revalidatePath("/teacher/profile");
  return { success: true, slug: clean };
}

// ====== TEACHER: Upload intro video (base64) ======
export async function uploadIntroVideo(videoBase64: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };
  if (videoBase64.length > 10 * 1024 * 1024) return { error: "Video too large (max 8MB)" };

  await db.teacher.update({ where: { userId: session.user.id }, data: { introVideoUrl: videoBase64 } });
  revalidatePath("/teacher/profile");
  return { success: true };
}

// ====== TEACHER: Upload profile picture ======
export async function uploadTeacherPhoto(photoBase64: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };
  if (photoBase64.length > 5 * 1024 * 1024) return { error: "Photo too large (max 4MB)" };

  await db.teacher.update({ where: { userId: session.user.id }, data: { profilePicture: photoBase64 } });
  revalidatePath("/teacher/profile");
  revalidatePath("/teacher");
  return { success: true };
}

// ====== STUDENT: Upload profile picture ======
export async function uploadStudentPhoto(photoBase64: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") return { error: "Unauthorized" };
  if (photoBase64.length > 5 * 1024 * 1024) return { error: "Photo too large (max 4MB)" };

  await db.student.update({ where: { userId: session.user.id }, data: { profilePicture: photoBase64 } });
  // Also update User image
  await db.user.update({ where: { id: session.user.id }, data: { image: photoBase64 } });
  revalidatePath("/student");
  return { success: true };
}

// ====== Generate student ID number ======
export async function generateStudentIdNumber() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") return { error: "Unauthorized" };

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });
  if (!student) return { error: "Student not found" };
  if (student.idNumber) return { success: true, idNumber: student.idNumber };

  // Format: SCHOOL_CODE-YEAR-SEQUENTIAL e.g. GDA-2026-0042
  const prefix = student.school.name.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase() || "GDA";
  const year = new Date().getFullYear();
  const count = await db.student.count({
    where: { schoolId: student.schoolId, idNumber: { not: null } },
  });
  const seq = String(count + 1).padStart(4, "0");
  const idNumber = `${prefix}-${year}-${seq}`;

  await db.student.update({ where: { id: student.id }, data: { idNumber } });
  revalidatePath("/student");
  return { success: true, idNumber };
}

// ====== Heartbeat: keep teacher online ======
export async function teacherHeartbeat() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return;
  await db.teacher.update({
    where: { userId: session.user.id },
    data: { lastSeenAt: new Date(), isOnline: true },
  });
}
