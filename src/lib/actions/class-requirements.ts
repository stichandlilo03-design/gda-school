"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addClassRequirement(data: {
  classId: string; item: string; description?: string; category?: string; isRequired?: boolean;
}) {
  try {
    const sess = await getServerSession(authOptions);
    if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };
    await db.classRequirement.create({
      data: {
        classId: data.classId,
        item: data.item,
        description: data.description,
        category: data.category || "GENERAL",
        isRequired: data.isRequired ?? true,
      },
    });
    revalidatePath("/teacher/classes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed" };
  }
}

export async function deleteClassRequirement(id: string) {
  try {
    const sess = await getServerSession(authOptions);
    if (!sess || sess.user.role !== "TEACHER") return { error: "Unauthorized" };
    await db.classRequirement.delete({ where: { id } });
    revalidatePath("/teacher/classes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed" };
  }
}
