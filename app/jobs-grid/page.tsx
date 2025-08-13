// app/jobs-grid/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MapPin, BadgeDollarSign, Briefcase, Scissors, Award } from "lucide-react";

export const dynamic = "force-dynamic";

function titleize(v?: string | null) {
  if (!v) return "";
  return String(v)
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function payText(job: any) {
  if (!job?.payVisible) return "Hidden";
  const out: string[] = [];
  if (job.compModel === "commission" || job.compModel === "hybrid") {
    if (job.payMin != null) out.push(`Commission: ${job.payMin}%`);
  }
  if (job.compModel === "hourly" || job.compModel === "hybrid") {
    const wage = job.payMax ?? job.payMin;
    if (wage != null) out.push(`Wage: ${wage} ${job.payUnit}`);
  }
  if (job.compModel === "booth_rent") {
    if (job.payMin != null) out.push(`Rent: ${job.payMin} ${job.payUnit}`);
  }
  return out.join(" · ") || "—";
}

export default async function JobsGridPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { location: true, photos: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="space-y-4">
      {/* Header labels (sticky) */}
      <div className="hidden md:block sticky top-0 z-10 rounded-xl border border-slate-800 bg-zinc-950/80 backdrop-blur p-3">
        <div className="flex items-center gap-3">
          {/* spacer aligns to photo column width */}
          <div className="w-[208px]" />
          <div className="grid grid-cols-7 gap-3 flex-1 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Business &amp; Title</div>
            <div className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Service</div>
            <div className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Schedule</div>
            <div className="flex items-center gap-2"><Award className="h-5 w-5" /> Experience</div>
            <div className="flex items-center gap-2"><BadgeDollarSign className="h-5 w-5" /> Compensation</div>
            <div className="flex items-center gap-2"><BadgeDollarSign className="h-5 w-5" /> Payment/Wage</div>
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Location</div>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-zinc-950/60 p-6 text-slate-200">
          No jobs yet. Post one or run <code>npm run seed</code>.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const photo = job.photos?.[0]?.url || "/placeholder.jpg";
            const loc = [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "—";
            const schedule = job.schedule ? titleize(job.schedule) : "—";
            const comp = job.compModel ? titleize(job.compModel) : "—";
            const exp = job.experienceText || "Any";

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-xl border border-slate-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition"
              >
                {/* Desktop row */}
                <div className="hidden md:flex items-stretch gap-3 p-3">
                  {/* Photo fixed column */}
                  <div className="w-[208px] rounded-lg overflow-hidden border border-slate-800 bg-black shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="" className="w-full h-28 object-cover" />
                  </div>

                  {/* 7-col info grid */}
                  <div className="grid grid-cols-7 gap-3 flex-1 items-center">
                    {/* Business & Title */}
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-slate-100">{job.businessName}</div>
                      <div className="text-sm text-slate-300 line-clamp-2 break-words">{job.title}</div>
                    </div>

                    {/* Service */}
                    <div className="text-sm text-slate-100">{titleize(job.role)}</div>

                    {/* Schedule */}
                    <div className="text-sm text-slate-100">{schedule}</div>

                    {/* Experience */}
                    <div className="text-sm text-slate-100">{exp}</div>

                    {/* Compensation */}
                    <div className="text-sm text-slate-100">Compensation: {comp}</div>

                    {/* Payment/Wage */}
                    <div className="text-sm text-slate-100">{payText(job)}</div>

                    {/* Location */}
                    <div className="text-sm text-slate-100">{loc}</div>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden p-3 space-y-2">
                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="" className="w-full h-40 object-cover" />
                  </div>
                  <div className="font-semibold text-slate-100">{job.businessName}</div>
                  <div className="text-sm text-slate-300">{job.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                    <div><span className="text-slate-400">Service: </span>{titleize(job.role)}</div>
                    <div><span className="text-slate-400">Schedule: </span>{schedule}</div>
                    <div><span className="text-slate-400">Experience: </span>{exp}</div>
                    <div><span className="text-slate-400">Comp: </span>{comp}</div>
                    <div className="col-span-2"><span className="text-slate-400">Pay: </span>{payText(job)}</div>
                    <div className="col-span-2 flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {loc}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
