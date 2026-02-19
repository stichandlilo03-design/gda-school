import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MessagesInbox from "@/components/messages-inbox";

export default async function StudentMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          principal: { include: { user: { select: { id: true, name: true, role: true } } } },
          teachers: {
            where: { status: "APPROVED", isActive: true },
            include: { teacher: { include: { user: { select: { id: true, name: true, role: true } } } } },
          },
        },
      },
    },
  });

  const allMessages = await db.message.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true, image: true } },
      receiver: { select: { id: true, name: true, role: true, image: true } },
    },
  });

  const convMap = new Map<string, any>();
  for (const msg of allMessages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === session.user.id ? msg.receiver : msg.sender;
    if (!convMap.has(partnerId)) {
      const unread = allMessages.filter((m) => m.senderId === partnerId && m.receiverId === session.user.id && !m.isRead).length;
      convMap.set(partnerId, { partner, lastMessage: msg, unread });
    }
  }

  const contacts: { id: string; name: string; role: string }[] = [];
  const seen = new Set<string>();
  if (student?.school.principal?.user && !seen.has(student.school.principal.user.id)) {
    contacts.push({ id: student.school.principal.user.id, name: student.school.principal.user.name, role: "PRINCIPAL" });
    seen.add(student.school.principal.user.id);
  }
  for (const st of student?.school.teachers || []) {
    if (!seen.has(st.teacher.user.id)) {
      contacts.push({ id: st.teacher.user.id, name: st.teacher.user.name, role: "TEACHER" });
      seen.add(st.teacher.user.id);
    }
  }

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Chat with teachers & administration" />
      <div className="p-6 lg:p-8">
        <MessagesInbox
          conversations={JSON.parse(JSON.stringify(Array.from(convMap.values())))}
          contacts={contacts}
          currentUserId={session.user.id}
        />
      </div>
    </>
  );
}
