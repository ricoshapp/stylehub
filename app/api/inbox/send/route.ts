// app/api/inbox/send/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseThreadKey(key?: string | null) {
  if (!key) return { otherId: null as string | null, jobId: null as string | null };
  const [otherId, jobPart] = key.split("__");
  return { otherId, jobId: jobPart === "none" ? null : jobPart };
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bodyJson = await req.json();
  const raw = String(bodyJson?.body || "").trim();
  if (!raw) return NextResponse.json({ error: "Message body required" }, { status: 400 });
  if (raw.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  let toUserId: string | null = bodyJson?.toUserId ?? null;
  let jobId: string | null = bodyJson?.jobId ?? null;

  if (bodyJson?.threadKey) {
    const parsed = parseThreadKey(bodyJson.threadKey);
    toUserId = parsed.otherId;
    jobId = parsed.jobId;
  }

  if (!toUserId) return NextResponse.json({ error: "Recipient required" }, { status: 400 });

  // Optional sanity: ensure recipient exists
  const rec = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
  if (!rec) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  const msg = await prisma.message.create({
    data: {
      senderId: me.id,
      recipientId: toUserId,
      jobId: jobId || null,
      body: raw,
    },
    select: { id: true, body: true, createdAt: true, senderId: true },
  });

  return NextResponse.json({
    message: {
      id: msg.id,
      body: msg.body,
      createdAt: msg.createdAt,
      fromMe: true,
    },
  });
}
