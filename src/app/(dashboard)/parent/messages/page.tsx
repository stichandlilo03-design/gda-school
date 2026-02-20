import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";

export default async function ParentMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const messages = await db.message.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: { select: { name: true, role: true, image: true } },
      receiver: { select: { name: true, role: true } },
    },
  });

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Communication with teachers and school" />
      <div className="p-6 lg:p-8 space-y-4">
        {messages.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Messages from teachers and principals will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const isMine = m.senderId === session.user.id;
              return (
                <div key={m.id} className={`p-3 rounded-xl ${isMine ? "bg-brand-50 border border-brand-200 ml-8" : "bg-white border border-gray-200 mr-8"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold">{isMine ? "You" : m.sender.name} <span className="text-gray-400 font-normal">→ {isMine ? m.receiver.name : "You"}</span></span>
                    <span className="text-[9px] text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  {m.subject && <p className="text-xs font-medium">{m.subject}</p>}
                  <p className="text-xs text-gray-600 mt-0.5">{m.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
