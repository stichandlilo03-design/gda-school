import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MessagesInbox from "@/components/messages-inbox";

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


  try {
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        schools: {
          where: { status: "APPROVED", isActive: true },
          include: { school: { include: { principal: { include: { user: { select: { id: true, name: true, role: true } } } } } } },
        },
      },
    });

    // Get all messages for this user
    const allMessages = await db.message.findMany({
      where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, role: true, image: true } },
        receiver: { select: { id: true, name: true, role: true, image: true } },
      },
    });

    // Build conversations
    const convMap = new Map<string, any>();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === session.user.id ? msg.receiver : msg.sender;
      if (!convMap.has(partnerId)) {
        const unread = allMessages.filter((m: any) => m.senderId === partnerId && m.receiverId === session.user.id && !m.isRead).length;
        convMap.set(partnerId, { partner, lastMessage: msg, unread });
      }
    }
    const conversations = Array.from(convMap.values());

    // Build contacts list (principals + other teachers in same school)
    const contacts: { id: string; name: string; role: string }[] = [];
    const seen = new Set<string>();
    for (const st of teacher?.schools || []) {
      if (st.school.principal?.user && !seen.has(st.school.principal.user.id)) {
        contacts.push({ id: st.school.principal.user.id, name: st.school.principal.user.name, role: "PRINCIPAL" });
        seen.add(st.school.principal.user.id);
      }
    }

  } catch (err: any) {
    console.error("messages page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Chat with your school administration" />
      <div className="p-6 lg:p-8">
        <MessagesInbox
          conversations={JSON.parse(JSON.stringify(conversations))}
          contacts={contacts}
          currentUserId={session.user.id}
        />
      </div>
    </>
  );
}
