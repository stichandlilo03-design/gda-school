"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Update teacher profile
export async function updateTeacherProfile(data: {
  bio?: string;
  headline?: string;
  teachingStyle?: string;
  yearsExperience?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  introVideoUrl?: string;
  qualifications?: string[];
  languages?: string[];
  achievements?: string[];
  subjects?: string[];
  preferredGrades?: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  await db.teacher.update({
    where: { id: teacher.id },
    data: {
      bio: data.bio ?? undefined,
      headline: data.headline ?? undefined,
      teachingStyle: data.teachingStyle ?? undefined,
      yearsExperience: data.yearsExperience ?? undefined,
      linkedinUrl: data.linkedinUrl ?? undefined,
      twitterUrl: data.twitterUrl ?? undefined,
      websiteUrl: data.websiteUrl ?? undefined,
      introVideoUrl: data.introVideoUrl ?? undefined,
      qualifications: data.qualifications ?? undefined,
      languages: data.languages ?? undefined,
      achievements: data.achievements ?? undefined,
      subjects: data.subjects ?? undefined,
      preferredGrades: data.preferredGrades ?? undefined,
    },
  });

  revalidatePath("/teacher/profile");
  revalidatePath("/student/teachers");
  return { success: true };
}

// Update user name and phone
export async function updateTeacherUserInfo(data: { name?: string; phone?: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name ?? undefined,
      phone: data.phone ?? undefined,
    },
  });

  revalidatePath("/teacher/profile");
  return { success: true };
}

// Upload profile picture (base64 → file on disk)
export async function uploadProfilePicture(base64Data: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  // Validate base64
  const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return { error: "Invalid image format" };

  const ext = match[1].split("/")[1];
  if (!["jpeg", "jpg", "png", "webp", "gif"].includes(ext)) return { error: "Unsupported format" };

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 5 * 1024 * 1024) return { error: "Image too large (max 5MB)" };

  // Save to public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `${teacher.id}-${Date.now()}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);

  // Delete old picture
  if (teacher.profilePicture) {
    const oldPath = path.join(process.cwd(), "public", teacher.profilePicture);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const url = `/uploads/profiles/${filename}`;
  await db.teacher.update({ where: { id: teacher.id }, data: { profilePicture: url } });

  // Also update user image
  await db.user.update({ where: { id: session.user.id }, data: { image: url } });

  revalidatePath("/teacher/profile");
  revalidatePath("/student/teachers");
  return { success: true, url };
}

// Remove profile picture
export async function removeProfilePicture() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  if (teacher.profilePicture) {
    const oldPath = path.join(process.cwd(), "public", teacher.profilePicture);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await db.teacher.update({ where: { id: teacher.id }, data: { profilePicture: null } });
  await db.user.update({ where: { id: session.user.id }, data: { image: null } });

  revalidatePath("/teacher/profile");
  return { success: true };
}
