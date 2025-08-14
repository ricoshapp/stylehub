import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { zInquiryCreate } from "@/lib/validation";
import { Prisma } from "@prisma/client";

/** Resolve job owner for both new/legacy rows */
async function resolveOwner(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        ownerId: true,
        employerProfile: { select: { userId: true } },
      },
    });
    if (!job) return { step: "owner:job", tag: "E_JOB_NOT_FOUND" as const, status: 404 };
    const ownerId = job.ownerId ?? job.employerProfile?.userId ?? null;
    if (!ownerId) return { step: "owner:none", tag: "E_NO_OWNER_ON_JOB" as const, status: 422 };
    return { step: "owner:ok", tag: "OK" as const, status: 200, ownerId };
  } catch (e: any) {
    return {
      step: "owner:exception",
      tag: "E_OWNER_EXCEPTION" as const,
      status: 500,
      detail: String(e?.message || e),
    };
  }
}

/** POST /api/inbox/enquiries  — create/update inquiry */
export async function POST(req: Request) {
  const step = { at: "init" as string };
  try {
    step.at = "auth";
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ tag: "E_UNAUTHORIZED", step }, { status: 401 });

    step.at = "parse";
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ tag: "E_BAD_JSON", step }, { status: 400 });

    step.at = "zod";
    const parsed = zInquiryCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ tag: "E_ZOD", step, issues: parsed.error.flatten() }, { status: 400 });
    }
    const { jobId, name, phone, note } = parsed.data; // phone is 10 digits (normalized by zod)

    step.at = "owner";
    const owner = await resolveOwner(jobId);
    if (owner.tag !== "OK") {
      return NextResponse.json({ tag: owner.tag, step: { ...step, owner: owner.step }, detail: owner.detail }, { status: owner.status });
    }

    step.at = "model:check";
    // quick ping to ensure Inquiry model/table is reachable
    await prisma.inquiry.count({ where: { id: "__noop__" } }).catch(() => { /* ignore count error */ });

    step.at = "read";
    const existing = await prisma.inquiry.findFirst({
      where: { senderId: me.id, jobId },
      select: { id: true },
    });

    step.at = existing ? "update" : "create";
    const saved = existing
      ? await prisma.inquiry.update({
          where: { id: existing.id },
          data: { name, phone, note: note || null },
        })
      : await prisma.inquiry.create({
          data: {
            senderId: me.id,
            jobId,
            ownerId: owner.ownerId!,
            name,
            phone,
            note: note || null,
          },
        });

    step.at = "done";
    return NextResponse.json({ tag: "OK_CREATED", id: saved.id, step }, { status: 200 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { tag: "E_PRISMA", code: e.code, meta: e.meta, message: e.message, step },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { tag: "E_UNHANDLED", step, detail: String(e?.message || e), stack: e?.stack },
      { status: 500 }
    );
  }
}

/** GET — role-aware list (unchanged) */
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ tag: "E_UNAUTHORIZED" }, { status: 401 });

    if (me.role === "talent") {
      const rows = await prisma.inquiry.findMany({
        where: { senderId: me.id },
        orderBy: { createdAt: "desc" },
        include: { job: { include: { location: true, photos: true } } },
      });
      return NextResponse.json({ tag: "OK_TALENT", items: rows }, { status: 200 });
    } else {
      const rows = await prisma.inquiry.findMany({
        where: { ownerId: me.id },
        orderBy: { createdAt: "desc" },
        include: {
          job: { select: { id: true, title: true, businessName: true, role: true } },
          sender: { select: { id: true, username: true, email: true } },
        },
      });
      return NextResponse.json({ tag: "OK_EMPLOYER", items: rows }, { status: 200 });
    }
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { tag: "E_PRISMA", code: e.code, meta: e.meta, message: e.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ tag: "E_UNHANDLED", detail: String(e?.message || e) }, { status: 500 });
  }
}
