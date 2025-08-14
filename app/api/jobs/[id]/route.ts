// app/api/jobs/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function ensureOwner(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, employerProfile: { select: { userId: true } } },
  });
  if (!job) return { ok: false, status: 404 as const, message: "Not found" };
  if (job.employerProfile?.userId !== userId)
    return { ok: false, status: 403 as const, message: "Forbidden" };
  return { ok: true as const };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const auth = await ensureOwner(params.id, me.id);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const body = await req.json().catch(() => ({}));

    // Allow status updates, and a few light fields (avoid huge edit scope here)
    const allowed: Record<string, unknown> = {};
    if (typeof body?.status === "string") {
      if (!["ACTIVE", "PAUSED", "CLOSED"].includes(body.status)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 });
      }
      allowed.status = body.status;
    }
    if (typeof body?.title === "string") allowed.title = body.title.slice(0, 120);
    if (typeof body?.payVisible === "boolean") allowed.payVisible = body.payVisible;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ message: "No changes" }, { status: 400 });
    }

    await prisma.job.update({
      where: { id: params.id },
      data: allowed,
    });

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to update job", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const auth = await ensureOwner(params.id, me.id);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to delete job", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
