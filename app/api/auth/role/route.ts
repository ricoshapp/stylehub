// app/api/auth/role/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { role } = await req.json().catch(() => ({}));
  if (role !== "talent" && role !== "employer") {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  // Persist for 30 days
  const res = NextResponse.json({ message: "OK" });
  res.cookies.set({
    name: "sh_role",
    value: role,
    httpOnly: false, // readable by client for UI, safe enough as it's not auth
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function GET() {
  const c = cookies().get("sh_role")?.value || null;
  return NextResponse.json({ role: c });
}
