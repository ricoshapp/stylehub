// app/api/auth/check-username/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const zUsername = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9._-]+$/);

const RESERVED = new Set([
  "admin","root","support","help","about","contact","settings",
  "inbox","profile","jobs","post","signin","signup","api"
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get("u") || "").trim();

  const parsed = zUsername.safeParse(u);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, available: false, reason: "invalid" });
  }
  if (RESERVED.has(u.toLowerCase())) {
    return NextResponse.json({ ok: true, available: false, reason: "reserved" });
  }

  const existing = await prisma.user.findFirst({
    where: { username: u },
    select: { id: true },
  });

  return NextResponse.json({
    ok: true,
    available: !existing,
    reason: existing ? "taken" : "ok",
  });
}
