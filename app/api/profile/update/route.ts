// app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    // Only update allowed fields; role changes are ignored (RoleSwitcher controls role via cookie)
    const data: { name?: string } = {};
    if (name) data.name = name;

    if (!data.name) {
      return NextResponse.json(
        { error: "Nothing to update." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: me.id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to update profile" },
      { status: 500 }
    );
  }
}
