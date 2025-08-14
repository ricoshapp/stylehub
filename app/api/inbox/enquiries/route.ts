// app/api/inbox/enquiries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { zInquiryCreate } from "@/lib/validation";

function getInquiryModelRW() {
  const anyPrisma = prisma as any;
  return (anyPrisma.inquiry ?? anyPrisma.enquiry) as
    | { findFirst: Function; create: Function }
    | undefined;
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const Inquiry = getInquiryModelRW();
    if (!Inquiry) {
      return NextResponse.json(
        { message: "Inquiries are not enabled on this environment." },
        { status: 501 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = zInquiryCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { jobId, name, phone, note } = parsed.data;

    // Dupe check (friendly)
    const existing = await (Inquiry as any).findFirst({
      where: { senderId: me.id, jobId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { message: "You already inquired on this listing." },
        { status: 409 }
      );
    }

    // Create inquiry
    const created = await (Inquiry as any).create({
      data: {
        senderId: me.id,
        jobId,
        name: name ?? null,
        phone: phone ?? null,
        note: note ?? null,
      },
      select: { id: true, jobId: true },
    });

    // Bump inquiriesCount (best-effort)
    try {
      await prisma.job.update({
        where: { id: created.jobId },
        data: { inquiriesCount: { increment: 1 } },
      });
    } catch (_) {
      // ignore; don’t block success
    }

    return NextResponse.json({ message: "OK", id: created.id }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { message: "You already inquired on this listing." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Failed to create inquiry", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
