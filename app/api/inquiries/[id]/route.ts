// app/api/inquiries/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  // Allow either party (sender or owner/employer) to delete the inquiry.
  // Fallback to job->employerProfile->userId in case ownerId wasn’t set in older data.
  const canDelete = await prisma.inquiry.findFirst({
    where: {
      id,
      OR: [
        { senderId: me.id },
        { ownerId: me.id },
        { job: { employerProfile: { userId: me.id } } },
      ],
    },
    select: { id: true },
  });

  if (!canDelete) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.inquiry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
