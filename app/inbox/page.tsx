// app/inbox/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import InquiryListClient from "@/components/InquiryListClient";

export const dynamic = "force-dynamic";

// Try to get whichever model exists (Inquiry or Enquiry)
function getInquiryModel() {
  const anyPrisma = prisma as any;
  return (anyPrisma.inquiry ?? anyPrisma.enquiry) as
    | { findMany: Function; count: Function }
    | null;
}

// Robust mode resolver with overrides and fallbacks
async function resolveUserMode(
  userId: string,
  searchParams: Record<string, string | string[] | undefined>
): Promise<"talent" | "employer"> {
  // 1) URL override
  const asParam = (typeof searchParams?.as === "string" ? searchParams.as : undefined)?.toLowerCase();
  if (asParam === "talent" || asParam === "employer") return asParam;

  // 2) User.role when present (ignore if schema doesn't have it)
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      // If your schema doesn't have role, this select will throw, we catch below
      select: { role: true as any },
    } as any);
    if (u?.role === "talent" || u?.role === "employer") return u.role;
  } catch (_) {
    // no-op
  }

  // 3/4) Profiles
  const [talent, employer] = await Promise.all([
    prisma.talentProfile.findFirst({ where: { userId }, select: { id: true } }),
    prisma.employerProfile.findFirst({ where: { userId }, select: { id: true } }),
  ]);
  if (talent && !employer) return "talent";
  if (employer && !talent) return "employer";
  if (talent && employer) return "talent"; // prefer Talent if both

  // 5) If user has sent any inquiries, treat as talent
  const Inquiry = getInquiryModel();
  if (Inquiry) {
    try {
      const c = await (Inquiry as any).count({ where: { senderId: userId } });
      if (c > 0) return "talent";
    } catch {
      // ignore
    }
  }

  // 6) Default
  return "talent";
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-slate-100">
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <p className="mt-2 text-slate-300">Please sign in to view inquiries.</p>
      </div>
    );
  }

  const Inquiry = getInquiryModel();
  const mode = await resolveUserMode(me.id, searchParams);

  if (!Inquiry) {
    const title = mode === "talent" ? "My Inquiries" : "Inquiries";
    const subtitle =
      mode === "talent" ? "Listings you Inquired" : "Talent who contacted you.";
    return (
      <div className="max-w-5xl mx-auto p-6 text-slate-100">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-slate-300">{subtitle}</p>
        <div className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4">
          <p className="text-sm">
            Inquiries aren’t enabled yet. Run <code>npx prisma generate</code> and ensure the model
            exists in <code>prisma/schema.prisma</code>.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "employer") {
    // Incoming inquiries for this employer's jobs
    const items = await (Inquiry as any).findMany({
      where: { job: { employerProfile: { userId: me.id } } },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            businessName: true,
            photos: { select: { url: true }, take: 1 },
            location: { select: { city: true, state: true } },
            employerProfile: { select: { shopName: true } },
          },
        },
      },
    });

    const mapped = items.map((inq: any) => ({
      id: inq.id,
      createdAt: inq.createdAt?.toString() ?? "",
      name: inq.name ?? "",
      phone: inq.phone ?? "",
      note: inq.note ?? null,
      job: {
        id: inq.job?.id ?? "",
        title: inq.job?.title ?? "",
        business: inq.job?.businessName || inq.job?.employerProfile?.shopName || "Business",
        thumb: inq.job?.photos?.[0]?.url ?? "/placeholder.jpg",
        city:
          [inq.job?.location?.city, inq.job?.location?.state].filter(Boolean).join(", ") ||
          "San Diego County",
      },
    }));

    return (
      <div className="max-w-6xl mx-auto p-6 text-slate-100">
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <p className="mt-1 text-slate-300">Talent who contacted you.</p>
        <InquiryListClient mode="employer" items={mapped} />
      </div>
    );
  }

  // Talent view: outgoing inquiries
  const items = await (Inquiry as any).findMany({
    where: { senderId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          businessName: true,
          photos: { select: { url: true }, take: 1 },
          location: { select: { city: true, state: true } },
          employerProfile: { select: { shopName: true } },
        },
      },
    },
  });

  const mapped = items.map((inq: any) => ({
    id: inq.id,
    createdAt: inq.createdAt?.toString() ?? "",
    name: inq.name ?? "",
    phone: inq.phone ?? "",
    note: inq.note ?? null,
    job: {
      id: inq.job?.id ?? "",
      title: inq.job?.title ?? "",
      business: inq.job?.businessName || inq.job?.employerProfile?.shopName || "Business",
      thumb: inq.job?.photos?.[0]?.url ?? "/placeholder.jpg",
      city:
        [inq.job?.location?.city, inq.job?.location?.state].filter(Boolean).join(", ") ||
        "San Diego County",
    },
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 text-slate-100">
      <h1 className="text-2xl font-bold">My Inquiries</h1>
      <p className="mt-1 text-slate-300">Listings you Inquired</p>
      <InquiryListClient mode="talent" items={mapped} />
    </div>
  );
}
