// app/jobs/[id]/page.tsx
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";
import SafeImage from "@/components/SafeImage";
import MapSpot from "@/components/MapSpot";
import InquireButton from "@/components/InquireButton";

function titleize(v?: string | null) {
  if (!v) return "";
  return v
    .toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function toNumber(n: any): number | null {
  if (n == null) return null;
  const val = Number(n);
  return Number.isFinite(val) ? val : null;
}

function compLabel(model?: string | null) {
  switch (model) {
    case "booth_rent":
      return "Booth Rent";
    case "commission":
      return "Commission";
    case "hourly":
      return "Hourly";
    case "hybrid":
      return "Hybrid";
    case "daily":
      return "Daily";
    default:
      return model ? titleize(model.replaceAll("_", " ")) : "Compensation";
  }
}

/** Pretty one-line compensation display per your spec. */
function formatComp(job: {
  compModel?: string | null;
  payVisible?: boolean | null;
  payMin?: any;
  payMax?: any;
  payUnit?: string | null;
}) {
  if (!job.payVisible) return null;

  const model = job.compModel ?? undefined;
  const label = compLabel(model);
  const min = toNumber(job.payMin);
  const max = toNumber(job.payMax);
  const unit = (job.payUnit || "").trim();

  // Hybrid: "% & $/hr"
  if (model === "hybrid") {
    if (min != null && max != null) return `${label} — ${min}% & $${max}/hr`;
    if (min != null) return `${label} — ${min}%`;
    if (max != null) return `${label} — $${max}/hr`;
    return label;
  }

  // Commission: percent only
  if (model === "commission") {
    if (min != null && max != null) return `${label} — ${min}–${max}%`;
    if (min != null) return `${label} — ${min}%`;
    if (max != null) return `${label} — ${max}%`;
    return label;
  }

  // Booth/Hourly/Daily: show $ + unit (range if both)
  const showUnit =
    unit ||
    (model === "hourly" ? "$/hr" : model === "daily" ? "$/d" : undefined);

  if (min != null && max != null) {
    if (showUnit?.startsWith("$/")) {
      return `${label} — $${min}–$${max}${showUnit.slice(1)}`; // "$/wk" -> "/wk"
    }
    return `${label} — ${min}–${max} ${showUnit ?? ""}`.trim();
  }
  if (min != null) {
    if (showUnit?.startsWith("$/")) return `${label} — $${min}${showUnit.slice(1)}`;
    return `${label} — ${showUnit?.includes("$") ? "" : "$"}${min}${showUnit ? ` ${showUnit}` : ""}`.trim();
  }
  if (max != null) {
    if (showUnit?.startsWith("$/")) return `${label} — $${max}${showUnit.slice(1)}`;
    return `${label} — ${showUnit?.includes("$") ? "" : "$"}${max}${showUnit ? ` ${showUnit}` : ""}`.trim();
  }

  return label;
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const activeRole =
    (cookies().get("sh_role")?.value as "talent" | "employer" | undefined) ?? "talent";

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      photos: { select: { url: true }, take: 6 },
      employerProfile: { select: { shopName: true } },
    },
  });

  if (!job) return notFound();

  const coverUrl = job.photos?.[0]?.url ?? "/placeholder.jpg";
  const cityState = [titleize(job.location?.city), job.location?.state]
    .filter(Boolean)
    .join(", ");
  const isTalent = activeRole !== "employer";

  const compText = formatComp({
    compModel: job.compModel,
    payVisible: job.payVisible,
    payMin: job.payMin,
    payMax: job.payMax,
    payUnit: job.payUnit,
  });

  return (
    <div className="space-y-6">
      {/* Top header row (no button here anymore) */}
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {job.businessName || job.employerProfile?.shopName || "Listing"}
          </h1>
          <div className="text-base text-slate-300">
            <span className="font-medium">{job.title}</span>
            {cityState ? <span className="text-slate-400"> · {cityState}</span> : null}
          </div>
        </div>
      </div>

      {/* Media + quick facts in a 2-column rail; image about half width on desktop */}
      <div className="grid gap-5 md:grid-cols-2 items-start">
        {/* Image rail: constrained height to shrink ~half visually */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-black/30">
          <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
            <SafeImage
              src={coverUrl}
              alt={job.title}
              className="h-full w-full object-cover"
              // @ts-ignore (SafeImage passes props to <img>)
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Quick facts + button anchored bottom-right */}
        <div className="rounded-xl border border-slate-800 bg-black/20 p-4 md:p-5 flex flex-col h-full">
          <div className="grid grid-cols-2 gap-3 text-sm flex-1">
            <div className="text-slate-400">Service</div>
            <div className="font-medium">{titleize(job.role)}</div>

            <div className="text-slate-400">Schedule / Employment</div>
            <div className="font-medium">
              {[
                job.schedule &&
                  String(job.schedule).replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
                job.employmentType &&
                  String(job.employmentType).replaceAll("_", " ").toUpperCase(),
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>

            <div className="text-slate-400">Experience</div>
            <div className="font-medium">{job.experienceText || "Any"}</div>

            {compText && (
              <>
                <div className="text-slate-400">Compensation</div>
                <div className="font-medium">{compText}</div>
              </>
            )}

            <div className="text-slate-400">Location</div>
            <div className="font-medium">{cityState || "—"}</div>
          </div>

          {isTalent && (
            <div className="mt-4 flex justify-end">
              <InquireButton jobId={job.id} />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {job.description ? (
        <section className="rounded-xl border border-slate-800 bg-black/20 p-4 md:p-5">
          <h2 className="text-lg font-semibold mb-2">About this listing</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
            {job.description}
          </p>
        </section>
      ) : null}

      {/* Map */}
      {job.location?.lat != null && job.location?.lng != null && (
        <section className="rounded-xl border border-slate-800 bg-black/20 p-3 md:p-4">
          <MapSpot lat={job.location.lat} lng={job.location.lng} height={260} />
        </section>
      )}

      {/* Back link */}
      <div>
        <Link href="/jobs" className="text-emerald-400 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    </div>
  );
}
