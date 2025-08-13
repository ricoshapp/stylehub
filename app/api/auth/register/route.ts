// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE, signAuthToken } from "@/lib/auth";
import { zUsername, zPassword, RESERVED_USERNAMES } from "@/lib/validation-auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    const email = (body?.email ? String(body.email).trim() : null) || null;
    const role = body?.role === "employer" ? "employer" : "talent";

    // Validate username
    const uParsed = zUsername.safeParse(username);
    if (!uParsed.success) {
      return NextResponse.json({ error: "Invalid username." }, { status: 400 });
    }
    if (RESERVED_USERNAMES.has(username.toLowerCase())) {
      return NextResponse.json({ error: "That username is reserved." }, { status: 400 });
    }

    // Validate password
    const pParsed = zPassword.safeParse(password);
    if (!pParsed.success) {
      return NextResponse.json({ error: pParsed.error.issues[0]?.message || "Weak password." }, { status: 400 });
    }

    // Check availability
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, email ? { email } : undefined].filter(Boolean) as any },
      select: { id: true, username: true, email: true },
    });
    if (exists?.username === username) {
      return NextResponse.json({ error: "Username already in use." }, { status: 409 });
    }
    if (email && exists?.email === email) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email, // optional
        role,
      },
      select: { id: true, username: true, email: true, role: true, name: true },
    });

    const token = await signAuthToken({
      sub: user.id,
      email: user.email || "",
      role: user.role as "employer" | "talent",
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
