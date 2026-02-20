import { db } from "@/lib/db";

// Smart notification system - sends Message from system
// Also used for in-app alerts between users

export async function notify(
  receiverUserId: string,
  subject: string,
  content: string,
  senderUserId?: string // If not provided, uses receiver as sender (system message)
) {
  try {
    // For system notifications, we use the receiver as both sender and receiver
    // with a [SYSTEM] prefix so the UI can distinguish
    const senderId = senderUserId || receiverUserId;
    await db.message.create({
      data: {
        senderId,
        receiverId: receiverUserId,
        subject: senderUserId ? subject : `[SYSTEM] ${subject}`,
        content,
        isRead: false,
      },
    });
    return true;
  } catch (e) {
    console.error("Notification error:", e);
    return false;
  }
}

// Notify multiple users
export async function notifyMany(
  receiverUserIds: string[],
  subject: string,
  content: string,
  senderUserId?: string
) {
  const results = await Promise.allSettled(
    receiverUserIds.map(id => notify(id, subject, content, senderUserId))
  );
  return results.filter(r => r.status === "fulfilled").length;
}

// Notify by role in a school
export async function notifySchoolRole(
  schoolId: string,
  role: "PRINCIPAL" | "TEACHER" | "STUDENT",
  subject: string,
  content: string,
  senderUserId?: string
) {
  try {
    let userIds: string[] = [];
    if (role === "PRINCIPAL") {
      const p = await db.principal.findFirst({ where: { schoolId }, select: { userId: true } });
      if (p) userIds = [p.userId];
    } else if (role === "TEACHER") {
      const teachers = await db.schoolTeacher.findMany({
        where: { schoolId, isActive: true, status: "APPROVED" },
        include: { teacher: { select: { userId: true } } },
      });
      userIds = teachers.map(t => t.teacher.userId);
    } else if (role === "STUDENT") {
      const students = await db.student.findMany({
        where: { schoolId, approvalStatus: "APPROVED" },
        select: { userId: true },
      });
      userIds = students.map(s => s.userId);
    }
    return notifyMany(userIds, subject, content, senderUserId);
  } catch {
    return 0;
  }
}

// Get all unread notification count
export async function getUnreadCount(userId: string): Promise<number> {
  return db.message.count({ where: { receiverId: userId, isRead: false } });
}
