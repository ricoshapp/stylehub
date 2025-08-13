// app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name : null;
  const role = body?.role === "employer" ? "employer" : "talent";

  const user = await prisma.user.update({
    where: { id: me.id },
    data: { name, role: role as any },
    select: { id: true, name: true, role: true },
  });

  return NextResponse.json({ ok: true, user });
}
