"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateTeacherProfile(data: {
  bio?: string; headline?: string; teachingStyle?: string; yearsExperience?: number;
  linkedinUrl?: string; twitterUrl?: string; websiteUrl?: string; introVideoUrl?: string;
  qualifications?: string[]; languages?: string[]; achievements?: string[];
  subjects?: string[]; preferredGrades?: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.teacher.update({
    where: { userId: session.user.id },
    data: {
      bio: data.bio, headline: data.headline, teachingStyle: data.teachingStyle,
      yearsExperience: data.yearsExperience || 0,
      linkedinUrl: data.linkedinUrl || null, twitterUrl: data.twitterUrl || null,
      websiteUrl: data.websiteUrl || null, introVideoUrl: data.introVideoUrl || null,
      qualifications: data.qualifications || [], languages: data.languages || [],
      achievements: data.achievements || [], subjects: data.subjects || [],
      preferredGrades: data.preferredGrades || [],
    },
  });

  revalidatePath("/teacher/profile");
  revalidatePath("/teacher");
  return { success: true };
}

export async function updateTeacherUserInfo(data: { name: string; phone?: string }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.user.update({
    where: { id: session.user.id },
    data: { name: data.name, phone: data.phone || null },
  });

  revalidatePath("/teacher/profile");
  revalidatePath("/teacher");
  return { success: true };
}

export async function uploadProfilePicture(base64: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };
  if (base64.length > 5 * 1024 * 1024) return { error: "File too large (max 4MB)" };

  await db.teacher.update({ where: { userId: session.user.id }, data: { profilePicture: base64 } });
  await db.user.update({ where: { id: session.user.id }, data: { image: base64 } });

  revalidatePath("/teacher/profile");
  revalidatePath("/teacher");
  return { success: true };
}

export async function removeProfilePicture() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized" };

  await db.teacher.update({ where: { userId: session.user.id }, data: { profilePicture: null } });
  await db.user.update({ where: { id: session.user.id }, data: { image: null } });

  revalidatePath("/teacher/profile");
  revalidatePath("/teacher");
  return { success: true };
}
