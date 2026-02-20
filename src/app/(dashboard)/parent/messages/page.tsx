import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ParentMessagesClient from "./parent-messages-client";

export default async function ParentMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              school: {
                include: {
                  principal: { include: { user: { select: { id: true, name: true, role: true, image: true } } } },
                },
              },
              enrollments: {
                where: { status: "ACTIVE" },
                include: { class: { include: { teacher: { include: { user: { select: { id: true, name: true, role: true, image: true } } } } } } },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  // Build list of contactable people (teachers + principals)
  const contacts: any[] = [];
  const seenIds = new Set<string>();
  parent.children.forEach((link) => {
    const child = link.student;
    const principal = child.school?.principal;
    if (principal?.user && !seenIds.has(principal.user.id)) {
      seenIds.add(principal.user.id);
      contacts.push({ ...principal.user, schoolName: child.school.name, childName: child.user.name, type: "Principal" });
    }
    child.enrollments.forEach((en: any) => {
      const teacher = en.class?.teacher;
      if (teacher?.user && !seenIds.has(teacher.user.id)) {
        seenIds.add(teacher.user.id);
        contacts.push({ ...teacher.user, schoolName: child.school.name, childName: child.user.name, type: "Teacher" });
      }
    });
  });

  const messages = await db.message.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true, image: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
  });

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Chat with your children's teachers and school principals" />
      <div className="p-6 lg:p-8">
        <ParentMessagesClient
          userId={session.user.id}
          contacts={JSON.parse(JSON.stringify(contacts))}
          messages={JSON.parse(JSON.stringify(messages))}
        />
      </div>
    </>
  );
}
