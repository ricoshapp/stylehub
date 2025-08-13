// app/api/inbox/threads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: me.id }, { recipientId: me.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, businessName: true } },
      sender: { select: { id: true, name: true, username: true } },
      recipient: { select: { id: true, name: true, username: true} },
    },
  });

  // Group by (otherUserId, jobId)
  const map = new Map<string, any>();
  for (const m of msgs) {
    const other =
      m.senderId === me.id ? m.recipient : m.sender;
    const jobId = m.jobId || "none";
    const key = `${other.id}__${jobId}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        otherUser: { id: other.id, name: other.name, username: other.username },
        job: m.job ? { id: m.job.id, title: m.job.title, businessName: m.job.businessName } : null,
        lastMessage: {
          body: m.body,
          createdAt: m.createdAt,
          fromMe: m.senderId === me.id,
        },
      });
    }
  }

  return NextResponse.json({ threads: Array.from(map.values()) });
}
