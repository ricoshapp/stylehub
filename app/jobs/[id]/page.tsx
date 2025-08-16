// app/jobs/[id]/page.tsx
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";
import SafeImage from "@/components/SafeImage";
import MapSpot from "@/components/MapSpot";
import InquireButton from "@/components/InquireButton";

// ---------- helpers (pure UI formatting) ----------
function titleize(v?: string | null) {
  if (!v) return "";
  return v
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .split(" ")
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s))
    .join(" ");
}

function prettySchedule(s?: string | null) {
  if (!s) return "";
  if (s === "full_time") return "Full Time";
  if (s === "part_time") return "Part Time";
  if (s === "any") return "Any";
  return titleize(s);
}

function prettyEmployment(t?: string | null) {
  if (!t) return "";
  if (t === "w2") return "W2";
  if (t === "c1099") return "C1099";
  return titleize(t);
}

function toNumber(n: any): number | null {
  if (n == null) return null;
  const val = Number(n);
  return Number.isFinite(val) ? val : null;
}

function compHeader(model?: string | null) {
  switch (model) {
    case "booth_rent":
      return "Booth Rent";
    case "commission":
      return "Commission";
    case "hourly":
      return "Hourly";
    case "hybrid":
      return "Hybrid";
    default:
      return model ? titleize(model) : "Compensation";
  }
}

/** One-line breakdown text per model (no layout changes) */
function compBreakdown(
  model?: string | null,
  payMin?: any,
  payMax?: any,
  unit?: string | null
) {
  const min = toNumber(payMin);
  const max = toNumber(payMax);
  const u = (unit || "").trim();

  if (!model) return "";

  if (model === "hourly") {
    // Only $/hr, we render from payMin
    return min != null ? `$${min}/hr` : "";
  }

  if (model === "commission") {
    // Percent only, we render from payMin (single number)
    if (min != null && max != null) return `${min}–${max}%`;
    return min != null ? `${min}%` : "";
  }

  if (model === "booth_rent") {
    // $ + cadence (e.g., $/wk, $/d, $/m)
    const cadence = u.startsWith("$/") ? u.slice(1) : u; // "/wk"
    return min != null ? `$${min}${cadence}` : cadence;
  }

  if (model === "hybrid") {
    // percent + $/hr
    const pct = min != null ? `${min}%` : "";
    const wage = max != null ? `$${max}/hr` : "";
    return [pct, wage].filter(Boolean).join(" + ");
  }

  return "";
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const activeRole =
    (cookies().get("sh_role")?.value as "talent" | "employer" | undefined) ??
    "talent";

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      photos: { select: { url: true }, take: 6 },
      employerProfile: { select: { shopName: true, userId: true } }, // <- userId for InquireButton
    },
  });

  if (!job) return notFound();

  const isTalent = activeRole !== "employer";

  const cityState = [titleize(job.location?.city), job.location?.state]
    .filter(Boolean)
    .join(", ");

  // Schedule / Employment (e.g., "Any / C1099")
  const rawSchedule = (job as any).schedule as string | null | undefined;
  const scheduleStr = rawSchedule ? prettySchedule(rawSchedule) : "Any";
  const employmentStr = prettyEmployment((job as any).employmentType);
  const schedEmp = [scheduleStr, employmentStr].filter(Boolean).join(" / ");

  // Compensation
  const compHdr = compHeader((job as any).compModel);
  const compStr = compBreakdown(
    (job as any).compModel,
    job.payMin,
    job.payMax,
    job.payUnit
  );

  const coverUrl = job.photos?.[0]?.url ?? "/placeholder.jpg";

  return (
    <>
      {/* Top header row */}
      <h1 className="mb-1 text-2xl font-semibold">
        {job.businessName || job.employerProfile?.shopName || "Listing"}
      </h1>
      <div className="mb-4 text-sm text-zinc-400">
        {job.title} {cityState ? <span> · {cityState}</span> : null}
      </div>

      {/* Media + facts rail */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Image rail — constrained height to avoid giant hero */}
        <div className="relative w-full aspect-[16/9] max-h-[360px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <SafeImage src={coverUrl} alt={job.title} className="object-cover" />
        </div>

        {/* Quick facts box */}
        <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          {/* Service */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              Service
            </div>
            <div className="font-medium">{titleize(job.role)}</div>
          </div>

          {/* Schedule / Employment */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              Schedule / Employment
            </div>
            <div className="font-medium">{schedEmp || "—"}</div>
          </div>

          {/* Experience */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              Experience
            </div>
            <div className="font-medium">{job.experienceText || "Any"}</div>
          </div>

          {/* Compensation */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              {compHdr}
            </div>
            <div className="font-medium break-words">{compStr || "—"}</div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              Location
            </div>
            <div className="font-medium">{cityState || "—"}</div>
          </div>

          {/* Inquiry button bottom-right (talent only) */}
          {isTalent && job.employerProfile?.userId && (
            <div className="mt-auto flex justify-end pt-2">
              <InquireButton
                ownerId={job.employerProfile.userId}
                jobId={job.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {job.description ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">About this listing</h2>
          <p className="whitespace-pre-wrap break-words text-zinc-200">
            {job.description}
          </p>
        </section>
      ) : null}

      {/* Map */}
      {job.location?.lat != null && job.location?.lng != null && (
        <section className="mt-8">
          <MapSpot
            lat={job.location.lat}
            lng={job.location.lng}
            label={job.businessName || job.title}
          />
        </section>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link href="/jobs" className="text-sm text-zinc-400 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    </>
  );
}
