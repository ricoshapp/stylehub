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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{job.businessName}</h1>
          <div className="mt-1 line-clamp-2 text-white/70">
            {job.title} {cityState ? `· ${cityState}` : ""}
          </div>
        </div>

        {isTalent && <InquireButton jobId={job.id} />}
      </div>

      {/* Media (non-stretched, 4:3 rail) */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="relative aspect-[4/3] w-full">
          <SafeImage
            src={coverUrl}
            alt={`${job.businessName} photo`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="text-sm text-white/70">
          <div className="text-white/50">Service</div>
          <div className="font-medium">{titleize(job.role)}</div>
        </div>
        <div className="text-sm text-white/70">
          <div className="text-white/50">Schedule / Employment</div>
          <div className="font-medium">
            {[job.schedule, job.employmentType]
              .filter(Boolean)
              .map((s) =>
                String(s).replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())
              )
              .join(" · ") || "—"}
          </div>
        </div>
        <div className="text-sm text-white/70">
          <div className="text-white/50">Experience</div>
          <div className="font-medium">{job.experienceText || "Any"}</div>
        </div>
        {job.payVisible && (
          <div className="text-sm text-white/70 sm:col-span-2 lg:col-span-1">
            <div className="text-white/50">Compensation</div>
            <div className="font-medium">
              {job.compModel?.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
              {typeof job.payMin === "number" &&
                ` · ${job.payMin}${job.payUnit ? ` ${job.payUnit}` : ""}${
                  typeof job.payMax === "number" ? `–${job.payMax}` : ""
                }`}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm text-white/50">About this listing</div>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/90">
            {job.description}
          </p>
        </div>
      )}

      {/* Map */}
      {job.location?.lat != null && job.location?.lng != null && (
        <div className="rounded-xl border border-white/10 bg-white/5">
          <MapSpot lat={job.location.lat} lng={job.location.lng} />
        </div>
      )}

      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          href="/jobs"
          className="rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
        >
          ← Back to jobs
        </Link>
      </div>
    </div>
  );
}
