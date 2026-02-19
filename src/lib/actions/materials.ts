"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Add material — images stored as base64 in DB, videos/large files use URLs
export async function addMaterial(data: {
  classId: string; title: string; description?: string;
  type: string; url?: string; fileBase64?: string; fileName?: string;
}) {
  try {
    const sess = await getServerSession(authOptions);
    if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

    const teacher = await db.teacher.findUnique({ where: { userId: sess.user.id } });
    if (!teacher) return { error: "Teacher not found" };

    let finalUrl = data.url || "";
    let fileSize = 0;

    // Handle base64 file upload (stored directly in DB)
    if (data.fileBase64) {
      const match = data.fileBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        fileSize = Math.round((match[2].length * 3) / 4); // Approximate decoded size
        if (fileSize > 5 * 1024 * 1024) return { error: "File too large (max 5MB). For larger files, use a URL link." };
        finalUrl = data.fileBase64; // Store full data URL in DB
      }
    }

    if (!finalUrl) return { error: "Provide a URL or upload a file" };

    await db.classMaterial.create({
      data: {
        classId: data.classId,
        teacherId: teacher.id,
        title: data.title,
        description: data.description,
        type: data.type as any,
        url: finalUrl,
        fileSize: fileSize || null,
      },
    });

    revalidatePath("/teacher/materials");
    revalidatePath("/student/materials");
    return { success: true };
  } catch (err: any) {
    console.error("addMaterial error:", err);
    return { error: err.message || "Failed to upload material" };
  }
}

// Delete material
export async function deleteMaterial(materialId: string) {
  try {
    const sess = await getServerSession(authOptions);
    if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

    await db.classMaterial.delete({ where: { id: materialId } });
    revalidatePath("/teacher/materials");
    revalidatePath("/student/materials");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete" };
  }
}

// Toggle published state
export async function toggleMaterialPublished(materialId: string) {
  try {
    const sess = await getServerSession(authOptions);
    if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

    const material = await db.classMaterial.findUnique({ where: { id: materialId } });
    if (!material) return { error: "Not found" };

    await db.classMaterial.update({
      where: { id: materialId },
      data: { isPublished: !material.isPublished },
    });
    revalidatePath("/teacher/materials");
    revalidatePath("/student/materials");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle" };
  }
}
