// app/inbox/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InquiryListClient from "@/components/InquiryListClient";
import Link from "next/link";

/** Resolve model name differences (Inquiry vs Enquiry) safely. */
function getInquiryModel() {
  const anyPrisma = prisma as any;
  const model = anyPrisma.inquiry ?? anyPrisma.enquiry;
  if (!model) {
    throw new Error(
      "Inquiry/Enquiry model missing from Prisma Client. Run `npx prisma generate` and ensure the model exists in prisma/schema.prisma."
    );
  }
  return model as typeof prisma.inquiry;
}

export default async function InboxPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/signin");

  // Role view is controlled by the top header RoleSwitcher (cookie).
  // Fall back to stored role or "talent".
  const roleViewCookie = cookies().get("roleView")?.value as
    | "talent"
    | "employer"
    | undefined;
  const roleView =
    roleViewCookie ?? ((me as any).role ?? "talent");

  const Inquiry = getInquiryModel();

  if (roleView === "employer") {
    // EMPLOYER VIEW: show inquiries for jobs owned by this user
    const rows = await Inquiry.findMany({
      where: {
        job: { employerProfile: { userId: me.id } },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        name: true,
        phone: true,
        note: true,
        sender: { select: { id: true, username: true, name: true } },
        job: {
          select: {
            id: true,
            title: true,
            businessName: true,
            location: { select: { city: true, state: true } },
          },
        },
      },
    });

    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          <p className="text-sm text-white/60">Talent who contacted you.</p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/70">Nothing yet.</p>
          </div>
        ) : (
          <InquiryListClient roleView="employer" items={rows} />
        )}
      </section>
    );
  }

  // TALENT VIEW: show inquiries the current user sent
  const rows = await Inquiry.findMany({
    where: { senderId: me.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      phone: true,
      note: true,
      job: {
        select: {
          id: true,
          title: true,
          businessName: true,
          location: { select: { city: true, state: true } },
        },
      },
    },
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Inquiries</h1>
        <p className="text-sm text-white/60">Listings you inquired.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex items-center justify-between">
          <p className="text-sm text-white/70">
            No inquiries yet. Find a listing and tap&nbsp;
            <span className="font-medium">Inquire</span>.
          </p>
          <Link href="/jobs" className="btn">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <InquiryListClient roleView="talent" items={rows} />
      )}
    </section>
  );
}
