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

function fmtCityState(city?: string | null, state?: string | null) {
  const c = city ? city[0]?.toUpperCase() + city.slice(1).toLowerCase() : "";
  return [c, state ?? ""].filter(Boolean).join(", ");
}

export default async function InboxPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/signin");

  const roleCookie = cookies().get("roleView")?.value as
    | "talent"
    | "employer"
    | undefined;
  const roleView = roleCookie ?? ((me as any).role ?? "talent");

  const Inquiry = getInquiryModel();

  if (roleView === "employer") {
    // EMPLOYER: incoming inquiries for jobs owned by this user
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

    const items = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      name: r.name ?? "",
      phone: r.phone ?? "",
      note: r.note ?? "",
      jobId: r.job?.id ?? "",
      jobTitle: r.job?.title ?? "",
      businessName: r.job?.businessName ?? "",
      cityState: fmtCityState(r.job?.location?.city, r.job?.location?.state),
    }));

    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          <p className="text-sm text-white/60">Talent who contacted you.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/70">Nothing yet.</p>
          </div>
        ) : (
          <InquiryListClient roleView="employer" items={items} />
        )}
      </section>
    );
  }

  // TALENT: inquiries sent by this user
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

  const items = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    name: r.name ?? "",
    phone: r.phone ?? "",
    note: r.note ?? "",
    jobId: r.job?.id ?? "",
    jobTitle: r.job?.title ?? "",
    businessName: r.job?.businessName ?? "",
    cityState: fmtCityState(r.job?.location?.city, r.job?.location?.state),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Inquiries</h1>
        <p className="text-sm text-white/60">Listings you inquired.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex items-center justify-between">
          <p className="text-sm text-white/70">
            No inquiries yet. Find a listing and tap <span className="font-medium">Inquire</span>.
          </p>
          <Link href="/jobs" className="btn">Browse Jobs</Link>
        </div>
      ) : (
        <InquiryListClient roleView="talent" items={items} />
      )}
    </section>
  );
}
