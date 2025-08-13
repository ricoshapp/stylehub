// app/api/auth/dev-register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE, signAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, name, role } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (role !== "employer" && role !== "talent") {
      return NextResponse.json({ error: "Role must be employer or talent" }, { status: 400 });
    }

    // Prevent duplicate accounts
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: { email, name: name || null, role },
      select: { id: true, email: true, role: true, name: true },
    });

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role: role as "employer" | "talent",
    });

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Registration failed" }, { status: 500 });
  }
}
