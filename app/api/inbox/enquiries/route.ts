// app/api/inbox/enquiries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { zInquiryCreate } from "@/lib/validation";

// Helper to support Inquiry or Enquiry model names
function getInquiryModelRW() {
  const anyPrisma = prisma as any;
  return (anyPrisma.inquiry ?? anyPrisma.enquiry) as
    | {
        findFirst: Function;
        count: Function;
        create: Function;
      }
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

    // Duplicate check (friendly, before we rely on DB constraint)
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

    const created = await (Inquiry as any).create({
      data: {
        senderId: me.id,
        jobId,
        name: name ?? null,
        phone: phone ?? null,
        note: note ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json({ message: "OK", id: created.id }, { status: 200 });
  } catch (e: any) {
    // Catch unique constraint from DB as well (P2002)
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
