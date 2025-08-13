import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { zInquiryCreate } from "@/lib/validation";

// POST /api/inquiries  -> create (idempotent: one per user+job)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = zInquiryCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid payload", detail: parsed.error.flatten() }, { status: 400 });
    }
    const { jobId, note } = parsed.data;

    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, ownerId: true } });
    if (!job) return NextResponse.json({ message: "Job not found" }, { status: 404 });
    if (!job.ownerId) return NextResponse.json({ message: "Job owner not set on job" }, { status: 422 });

    // Upsert-like: ensure no duplicates per sender+job
    const existing = await prisma.inquiry.findUnique({
      where: { senderId_jobId: { senderId: user.id, jobId } },
    });

    const saved = existing
      ? existing
      : await prisma.inquiry.create({
          data: {
            senderId: user.id,
            jobId,
            ownerId: job.ownerId,
            note: note?.trim() || null,
          },
        });

    return NextResponse.json({ id: saved.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: "Failed to create enquiry", detail: String(e?.message || e) }, { status: 500 });
  }
}

// GET /api/inquiries -> list mine (role-aware)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (user.role === "talent") {
      const rows = await prisma.inquiry.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        include: { job: { include: { location: true, photos: true } } },
      });
      return NextResponse.json({ role: "talent", items: rows });
    } else {
      // default to employer view
      const rows = await prisma.inquiry.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          job: { select: { id: true, title: true, businessName: true } },
          sender: { select: { id: true, username: true, email: true } },
        },
      });
      return NextResponse.json({ role: "employer", items: rows });
    }
  } catch (e: any) {
    return NextResponse.json({ message: "Failed to fetch enquiries", detail: String(e?.message || e) }, { status: 500 });
  }
}
