// app/api/inquiries/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string } };

// Helper to tolerate Inquiry vs Enquiry model names
function getInquiryModel() {
  const anyPrisma = prisma as any;
  const model = anyPrisma.inquiry ?? anyPrisma.enquiry;
  if (!model) {
    throw new Error("Inquiry model missing from Prisma client.");
  }
  return model as typeof prisma.inquiry;
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const Inquiry = getInquiryModel();
    const id = params.id;

    // Load the inquiry with sender + job owner (via employerProfile.userId)
    const row = await Inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        senderId: true,
        job: {
          select: {
            employerProfile: { select: { userId: true } },
          },
        },
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isSender = row.senderId === me.id;
    const isOwner = row.job?.employerProfile?.userId === me.id;

    if (!isSender && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Inquiry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
