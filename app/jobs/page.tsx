// app/jobs/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MapPin, BadgeDollarSign, Briefcase, Scissors, Award, Info } from "lucide-react";

export const dynamic = "force-dynamic";

function titleize(v?: string | null) {
  if (!v) return "";
  return String(v)
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const DEMO_ROWS = [
  {
    id: "demo-1",
    businessName: "Downtown Barber Co.",
    title: "Chair available — walk-ins welcome",
    role: "barber",
    schedule: "full_time",
    compModel: "hourly",
    payMin: 24,
    payMax: null,
    payUnit: "$/hr",
    payVisible: true,
    experienceText: "2+ yrs",
    location: { city: "San Diego", state: "CA" },
    photos: [{ url: "/placeholder.jpg" }],
  },
  {
    id: "demo-2",
    businessName: "Pacific Ink Studio",
    title: "Tattoo artist booth — high foot traffic",
    role: "tattoo_artist",
    schedule: "any",
    compModel: "booth_rent",
    payMin: 400,
    payMax: null,
    payUnit: "$/wk",
    payVisible: true,
    experienceText: "Portfolio req.",
    location: { city: "Oceanside", state: "CA" },
    photos: [{ url: "/placeholder.jpg" }],
  },
  {
    id: "demo-3",
    businessName: "Luxe Lashes",
    title: "Lash tech — hybrid comp",
    role: "lash_tech",
    schedule: "part_time",
    compModel: "hybrid",
    payMin: 35,
    payMax: 20,
    payUnit: "$/hr",
    payVisible: true,
    experienceText: "Any",
    location: { city: "Chula Vista", state: "CA" },
    photos: [{ url: "/placeholder.jpg" }],
  },
];

export default async function JobsPage() {
  let dbJobs: any[] = [];
  try {
    dbJobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: { location: true, photos: { orderBy: { sortOrder: "asc" } } },
    });
  } catch {
    // swallow errors and fall back to demo rows
  }

  const jobs = dbJobs.length ? dbJobs : DEMO_ROWS;
  const demoMode = dbJobs.length === 0;

  return (
    <div className="space-y-4">
      {/* Header labels (sticky) */}
      <div className="hidden md:block sticky top-0 z-10 rounded-xl border border-slate-800 bg-zinc-950/80 backdrop-blur p-3">
        <div className="flex items-center gap-3">
          {/* spacer aligns to photo column width */}
          <div className="w-[208px]" />
          {/* 6 columns (Payment/Wage removed) */}
          <div className="grid grid-cols-6 gap-3 flex-1 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Business &amp; Title</div>
            <div className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Service</div>
            <div className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Schedule</div>
            <div className="flex items-center gap-2"><Award className="h-5 w-5" /> Experience</div>
            <div className="flex items-center gap-2"><BadgeDollarSign className="h-5 w-5" /> Compensation</div>
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Location</div>
          </div>
        </div>
      </div>

      {demoMode && (
        <div className="rounded-lg border border-slate-800 bg-zinc-950/60 p-3 text-sm text-slate-300 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Showing demo jobs (no records in your database yet). Post one at <code>/post</code> to see live data.
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job: any) => {
          const photo = job.photos?.[0]?.url || "/placeholder.jpg";
          const loc = [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "—";
          const schedule = job.schedule ? titleize(job.schedule) : "—";
          const comp = job.compModel ? titleize(job.compModel) : "—";
          const exp = job.experienceText || "Any";
          const href = demoMode ? "#" : `/jobs/${job.id}`;

          return (
            <Link
              key={job.id}
              href={href}
              className={`block rounded-xl border border-slate-800 bg-zinc-950/60 ${demoMode ? "pointer-events-none opacity-90" : "hover:bg-zinc-900/60"} transition`}
            >
              {/* Desktop row */}
              <div className="hidden md:flex items-stretch gap-3 p-3">
                {/* Photo fixed column */}
                <div className="w-[208px] rounded-lg overflow-hidden border border-slate-800 bg-black shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="w-full h-28 object-cover" />
                </div>

                {/* 6-col info grid */}
                <div className="grid grid-cols-6 gap-3 flex-1 items-center">
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

                  {/* Compensation (model only) */}
                  <div className="text-sm text-slate-100">{comp}</div>

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
                  <div className="col-span-2 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {loc}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
