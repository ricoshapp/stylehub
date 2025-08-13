// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name: string | undefined = body?.name;
    const role: "employer" | "talent" | undefined = body?.role;

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        name: typeof name === "string" ? name : undefined,
        role: role || undefined,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ user: null }, { status: 200 });
    return NextResponse.json({ user: me });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
