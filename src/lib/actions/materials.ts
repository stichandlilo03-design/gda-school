"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Add material with optional file upload
export async function addMaterial(data: {
  classId: string; title: string; description?: string;
  type: string; url?: string; fileBase64?: string; fileName?: string;
}) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: sess.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  let finalUrl = data.url || "";
  let fileSize = 0;

  // Handle file upload
  if (data.fileBase64) {
    const match = data.fileBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const buffer = Buffer.from(match[2], "base64");
      fileSize = buffer.length;
      if (fileSize > 50 * 1024 * 1024) return { error: "File too large (max 50MB)" };

      const ext = data.fileName?.split(".").pop() || getExtFromMime(match[1]);
      const dir = path.join(process.cwd(), "public", "uploads", "materials");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `${teacher.id}-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(dir, filename), buffer);
      finalUrl = `/uploads/materials/${filename}`;
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
}

// Delete material
export async function deleteMaterial(materialId: string) {
  const sess = await getServerSession(authOptions);
  if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };

  const material = await db.classMaterial.findUnique({ where: { id: materialId } });
  if (!material) return { error: "Not found" };

  // Delete file if it's a local upload
  if (material.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", material.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await db.classMaterial.delete({ where: { id: materialId } });
  revalidatePath("/teacher/materials");
  revalidatePath("/student/materials");
  return { success: true };
}

// Toggle published state
export async function toggleMaterialPublished(materialId: string) {
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
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
    "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  return map[mime] || "bin";
}
