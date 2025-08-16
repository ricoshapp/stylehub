// app/inbox/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import InquiryListClient from "@/components/InquiryListClient";

function titleize(v?: string | null) {
  if (!v) return "";
  return v
    .toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

// Support either Inquiry/Enquiry model naming
function getInquiryModel(anyPrisma: any) {
  return anyPrisma.inquiry ?? anyPrisma.enquiry;
}

export default async function InboxPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/signin");

  // Determine role (cookie or user.role if you store it; default to talent)
  const roleView: "talent" | "employer" =
    (me.role as any) === "employer" ? "employer" : "talent";

  const Inquiry = getInquiryModel(prisma);
  if (!Inquiry) {
    throw new Error(
      "Inquiry/Enquiry model missing from Prisma Client. Run `npx prisma generate`."
    );
  }

  if (roleView === "employer") {
    // Incoming inquiries for jobs owned by this employer
    const rows = await Inquiry.findMany({
      where: {
        OR: [
          { ownerId: me.id }, // if set during creation
          { job: { employerProfile: { userId: me.id } } }, // fallback based on job owner
        ],
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

    const items = rows.map((r: any) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      name: r.name || r.sender?.name || r.sender?.username || "Talent",
      phone: r.phone || "",
      note: r.note || "",
      jobId: r.job?.id ?? "",
      jobTitle: r.job?.title ?? "Listing",
      businessName: r.job?.businessName ?? "",
      cityState: [titleize(r.job?.location?.city), r.job?.location?.state]
        .filter(Boolean)
        .join(", "),
    }));

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Incoming Inquiries</h1>
          <p className="text-slate-400">Talent who contacted you</p>
        </div>
        <InquiryListClient roleView="employer" items={items} />
      </div>
    );
  }

  // Talent view — “My Inquiries”
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

  const items = rows.map((r: any) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    name: r.name || "",
    phone: r.phone || "",
    note: r.note || "",
    jobId: r.job?.id ?? "",
    jobTitle: r.job?.title ?? "Listing",
    businessName: r.job?.businessName ?? "",
    cityState: [titleize(r.job?.location?.city), r.job?.location?.state]
      .filter(Boolean)
      .join(", "),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Inquiries</h1>
        <p className="text-slate-400">Listings you inquired</p>
      </div>
      <InquiryListClient roleView="talent" items={items} />
    </div>
  );
}
