"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addBankAccount(data: {
  accountName: string; bankName: string; accountNumber: string;
  routingNumber?: string; swiftCode?: string; currency: string;
  country: string; instructions?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Not found" };

  await db.schoolBankAccount.create({
    data: { schoolId: principal.schoolId, ...data },
  });
  revalidatePath("/principal/bank-accounts");
  return { success: true };
}

export async function updateBankAccount(id: string, data: {
  accountName: string; bankName: string; accountNumber: string;
  routingNumber?: string; swiftCode?: string; currency: string;
  country: string; instructions?: string; isActive: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.schoolBankAccount.update({ where: { id }, data });
  revalidatePath("/principal/bank-accounts");
  return { success: true };
}

export async function deleteBankAccount(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };
  await db.schoolBankAccount.delete({ where: { id } });
  revalidatePath("/principal/bank-accounts");
  return { success: true };
}
