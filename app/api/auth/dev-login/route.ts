// app/api/auth/dev-login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE, signAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found. Please create one.", redirect: "/signup" },
        { status: 404 }
      );
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role: (user.role as "employer" | "talent") || "talent",
    });

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Login failed" }, { status: 500 });
  }
}
