// app/api/profile/role/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { roleView } = await req.json();
    if (roleView !== "talent" && roleView !== "employer") {
      return NextResponse.json({ error: "Invalid roleView" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true });
    // 30 days; cookie visible to all paths
    res.cookies.set("roleView", roleView, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
