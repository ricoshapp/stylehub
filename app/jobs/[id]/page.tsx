// app/jobs/[id]/page.tsx
import { prisma } from "@/lib/db";
import InquireButton from "@/components/InquireButton";
import Link from "next/link";

function titleize(v?: string | null) {
  if (!v) return "";
  return v
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!job) {
    return (
      <div className="card p-6">
        <div className="text-lg">Job not found.</div>
        <Link href="/jobs" className="underline mt-2 inline-block">Back to jobs</Link>
      </div>
    );
  }

  const photo = job.photos[0]?.url || "/placeholder.jpg";

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left: photo + basics */}
      <div className="md:col-span-2 space-y-4">
        <div className="rounded-2xl overflow-hidden border border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="w-full h-64 object-cover bg-black" />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 p-5 space-y-3">
          <h1 className="text-2xl font-semibold">{job.businessName}</h1>
          <div className="text-slate-300">{job.title}</div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Info label="Service" value={titleize(job.role)} />
            <Info label="Schedule" value={titleize(job.schedule || undefined)} />
            <Info label="Experience" value={job.experienceText || "Any"} />
            <Info
              label="Compensation"
              value={titleize(job.compModel)}
            />
            <Info
              label="Payment/Wage"
              value={
                job.payVisible
                  ? [
                      job.compModel === "commission" || job.compModel === "hybrid"
                        ? `Commission: ${job.payMin ?? "-"}%`
                        : null,
                      job.compModel === "hourly" || job.compModel === "hybrid"
                        ? `Wage: ${job.payMax ?? job.payMin ?? "-"} ${job.payUnit}`
                        : null,
                      job.compModel === "booth_rent"
                        ? `Rent: ${job.payMin ?? "-"} ${job.payUnit}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Hidden"
              }
            />
            <Info
              label="Location"
              value={[
                job.location?.city,
                job.location?.state,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          </div>

          {job.description && (
            <div className="pt-3 text-slate-200 whitespace-pre-wrap break-words">
              {job.description}
            </div>
          )}
        </div>
      </div>

      {/* Right: Inquire box */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 p-5">
          <div className="font-semibold mb-2">Inquire about this job</div>
          <InquireButton ownerId={job.ownerId} jobId={job.id} />
          <div className="mt-3 text-xs text-slate-500">
            Your inquiry opens a conversation in your Inbox.
          </div>
        </div>

        <Link href="/jobs" className="btn-secondary inline-flex">
          ← Back to jobs
        </Link>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-slate-100 break-words">{value || "—"}</div>
    </div>
  );
}
