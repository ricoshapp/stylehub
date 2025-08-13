// app/api/inbox/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseThreadKey(key: string) {
  // key format: "<otherUserId>__<jobId|none>"
  const [otherId, jobPart] = key.split("__");
  return { otherId, jobId: jobPart === "none" ? null : jobPart };
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("threadKey");
  if (!key) return NextResponse.json({ error: "threadKey required" }, { status: 400 });

  const { otherId, jobId } = parseThreadKey(key);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me.id, recipientId: otherId, jobId },
        { senderId: otherId, recipientId: me.id, jobId },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, senderId: true },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      fromMe: m.senderId === me.id,
    })),
  });
}
