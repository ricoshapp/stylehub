export const runtime = "nodejs";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const count = await prisma.user.count();
    return Response.json({ ok: true, userCount: count });
  } catch (e: any) {
    console.error("Health check error:", e);
    return new Response(e?.message || "DB error", { status: 500 });
  }
}
