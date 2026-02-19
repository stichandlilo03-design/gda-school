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
          principal: { include: { user: { select: { id: true, name: true, role: true, image: true } } } },
          teachers: {
            where: { status: "APPROVED", isActive: true },
            include: { teacher: { include: { user: { select: { id: true, name: true, role: true, image: true } } } } },
          },
        },
      },
      // Also get teachers from enrolled classes (student might be chatting with their class teacher)
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { id: true, name: true, role: true, image: true } } } },
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  // Fetch all messages for this user
  const allMessages = await db.message.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true, image: true } },
      receiver: { select: { id: true, name: true, role: true, image: true } },
    },
  });

  // Build conversations map
  const convMap = new Map<string, any>();
  for (const msg of allMessages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === session.user.id ? msg.receiver : msg.sender;
    if (!convMap.has(partnerId)) {
      const unread = allMessages.filter((m) => m.senderId === partnerId && m.receiverId === session.user.id && !m.isRead).length;
      convMap.set(partnerId, { partner, lastMessage: msg, unread });
    }
  }

  // Build contacts list — principal + all school teachers + enrolled class teachers
  const contacts: { id: string; name: string; role: string; image?: string | null }[] = [];
  const seen = new Set<string>();

  // Add principal
  if (student.school?.principal?.user && !seen.has(student.school.principal.user.id)) {
    const u = student.school.principal.user;
    contacts.push({ id: u.id, name: u.name + " (Principal)", role: "PRINCIPAL", image: u.image });
    seen.add(u.id);
  }

  // Add teachers from enrolled classes first (most relevant)
  for (const enrollment of student.enrollments || []) {
    const teacher = enrollment.class.teacher;
    if (teacher?.user && !seen.has(teacher.user.id)) {
      contacts.push({
        id: teacher.user.id,
        name: teacher.user.name + ` (${enrollment.class.name})`,
        role: "TEACHER",
        image: teacher.user.image,
      });
      seen.add(teacher.user.id);
    }
  }

  // Add other school teachers not already in list
  for (const st of student.school?.teachers || []) {
    if (st.teacher?.user && !seen.has(st.teacher.user.id)) {
      contacts.push({
        id: st.teacher.user.id,
        name: st.teacher.user.name,
        role: "TEACHER",
        image: st.teacher.user.image,
      });
      seen.add(st.teacher.user.id);
    }
  }

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Chat with your teachers & principal" />
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
