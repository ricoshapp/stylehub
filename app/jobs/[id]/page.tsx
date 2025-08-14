// app/jobs/[id]/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import dynamic from "next/dynamic";
import InquirySheet from "@/components/InquirySheet";

// If your MapSpot is a client component, dynamic import avoids SSR issues
const MapSpot = dynamic(() => import("@/components/MapSpot"), { ssr: false });

function titleize(v?: string | null) {
  if (!v) return "";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default async function JobDetail({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      photos: true,
      employerProfile: {
        include: { user: { select: { id: true, username: true } } },
      },
    },
  });

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-slate-100">Job not found</h1>
        <p className="mt-2 text-slate-300">
          <Link href="/jobs" className="underline">Back to Jobs</Link>
        </p>
      </div>
    );
  }

  const posterName = job.employerProfile?.user?.username ?? "Shop Owner";
  const displayBusiness = job.businessName ?? job.employerProfile?.shopName ?? "Business";
  const coverUrl = job.photos?.[0]?.url ?? "/placeholder.jpg";

  return (
    <div className="max-w-6xl mx-auto p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <img
          src={coverUrl}
          alt=""
          className="h-28 w-28 rounded-xl object-cover border border-white/10"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-tight break-words">{displayBusiness}</h1>
          <p className="mt-1 text-slate-300 break-words">{job.title}</p>
          <div className="mt-2 text-sm text-slate-400">
            Posted by <span className="text-slate-200">{posterName}</span>
          </div>
        </div>

        {/* Inquire button opens the sheet/modal */}
        <InquirySheet jobId={job.id} jobTitle={job.title ?? undefined} />
      </div>

      {/* Facts grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-xs uppercase tracking-wide text-slate-400">Service</div>
          <div className="mt-1 font-medium">{titleize(job.role)}</div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-xs uppercase tracking-wide text-slate-400">Compensation</div>
          <div className="mt-1 font-medium">
            {titleize(job.compModel)}{" "}
            {job.payVisible && (job.payMin || job.payMax)
              ? `• ${job.payMin ?? ""}${job.payMax ? `–${job.payMax}` : ""} ${job.payUnit}`
              : ""}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-xs uppercase tracking-wide text-slate-400">Schedule</div>
          <div className="mt-1 font-medium">{job.schedule ? titleize(job.schedule) : "Any"}</div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-xs uppercase tracking-wide text-slate-400">Experience</div>
          <div className="mt-1 font-medium">{job.experienceText || "Any"}</div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-xs uppercase tracking-wide text-slate-400">Location</div>
          <div className="mt-1 font-medium">
            {[
              job.location?.city,
              job.location?.state,
              job.location?.postalCode,
            ].filter(Boolean).join(", ") || "San Diego County"}
          </div>
        </div>
      </div>

      {/* Description */}
      {job.description ? (
        <div className="mt-6 rounded-xl border border-white/10 p-4 bg-white/5">
          <h2 className="text-lg font-semibold">About this listing</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-slate-200">{job.description}</p>
        </div>
      ) : null}

      {/* Map */}
      {job.location?.lat != null && job.location?.lng != null ? (
        <div className="mt-6 rounded-xl border border-white/10 p-2 bg-white/5">
          <MapSpot
            lat={Number(job.location.lat)}
            lng={Number(job.location.lng)}
            height={320}
            zoom={14}
          />
        </div>
      ) : null}
    </div>
  );
}
