// app/api/inquiries/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function getInquiryModelRW() {
  const anyPrisma = prisma as any;
  return (anyPrisma.inquiry ?? anyPrisma.enquiry) as
    | {
        findUnique: Function;
        delete: Function;
      }
    | undefined;
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

    const inq = await (Inquiry as any).findUnique({
      where: { id: params.id },
      include: {
        job: { select: { employerProfile: { select: { userId: true } } } },
      },
    });

    if (!inq) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const jobOwnerId = inq.job?.employerProfile?.userId ?? null;
    const canDelete = inq.senderId === me.id || (jobOwnerId && jobOwnerId === me.id);
    if (!canDelete) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await (Inquiry as any).delete({ where: { id: inq.id } });
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to delete inquiry", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
