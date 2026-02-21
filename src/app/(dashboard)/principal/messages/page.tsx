import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MessagesInbox from "@/components/messages-inbox";

export default async function PrincipalMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          teachers: {
            where: { status: "APPROVED" },
            include: { teacher: { include: { user: { select: { id: true, name: true, role: true } } } } },
          },
          students: {
            where: { approvalStatus: "APPROVED" },
            include: { user: { select: { id: true, name: true, role: true } } },
          },
        },
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
      const unread = allMessages.filter((m) => m.senderId === partnerId && m.receiverId === session.user.id && !m.isRead).length;
      convMap.set(partnerId, { partner, lastMessage: msg, unread });
    }
  }
  const conversations = Array.from(convMap.values());

  // Build contacts (all school teachers + students)
  const contacts: { id: string; name: string; role: string }[] = [];
  const seen = new Set<string>();
  for (const st of principal?.school.teachers || []) {
    if (!seen.has(st.teacher.user.id)) {
      contacts.push({ id: st.teacher.user.id, name: st.teacher.user.name, role: "TEACHER" });
      seen.add(st.teacher.user.id);
    }
  }
  for (const student of principal?.school.students || []) {
    if (!seen.has(student.user.id)) {
      contacts.push({ id: student.user.id, name: student.user.name, role: "STUDENT" });
      seen.add(student.user.id);
    }
  }

  // Add GDA Admin (site support) to contacts
  const gdaAdmin = await db.user.findFirst({ where: { email: "admin@gdaschools.sbs" }, select: { id: true, name: true } });
  if (gdaAdmin && !seen.has(gdaAdmin.id)) {
    contacts.unshift({ id: gdaAdmin.id, name: gdaAdmin.name || "GDA Admin", role: "SUPER_ADMIN" });
    seen.add(gdaAdmin.id);
  }

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Communicate with teachers & students" />
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
