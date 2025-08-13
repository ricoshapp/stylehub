// app/jobs/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MapPin, BadgeDollarSign, Briefcase, Scissors, Award, Info } from "lucide-react";
import FilterBar from "@/components/FilterBar";

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
    experienceText: "2+ yrs",
    location: { city: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611 },
    photos: [{ url: "/placeholder.jpg" }],
  },
  {
    id: "demo-2",
    businessName: "Pacific Ink Studio",
    title: "Tattoo artist booth — high foot traffic",
    role: "tattoo_artist",
    schedule: "any",
    compModel: "booth_rent",
    experienceText: "Portfolio req.",
    location: { city: "Oceanside", state: "CA", lat: 33.1959, lng: -117.3795 },
    photos: [{ url: "/placeholder.jpg" }],
  },
  {
    id: "demo-3",
    businessName: "Luxe Lashes",
    title: "Lash tech — hybrid comp",
    role: "lash_tech",
    schedule: "part_time",
    compModel: "hybrid",
    experienceText: "Any",
    location: { city: "Chula Vista", state: "CA", lat: 32.6401, lng: -117.0842 },
    photos: [{ url: "/placeholder.jpg" }],
  },
];

function buildWhere(searchParams: Record<string, string | string[] | undefined>) {
  const role = ((searchParams.role as string) || "").trim();
  const comp = ((searchParams.comp as string) || "").trim();
  const sched = ((searchParams.sched as string) || "").trim();
  const city = ((searchParams.city as string) || "").trim();
  const q = ((searchParams.q as string) || "").trim();

  const where: any = {};

  if (role) where.role = role;
  if (comp) where.compModel = comp;

  if (sched) {
    where.AND = [
      ...(where.AND || []),
      { OR: [{ employmentType: sched }, { schedule: sched }] },
    ];
  }

  if (city) {
    where.AND = [
      ...(where.AND || []),
      { location: { city: { contains: city, mode: "insensitive" } } },
    ];
  }

  if (q) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { businessName: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

function milesBetween(aLat: number, aLng: number, bLat?: number | null, bLng?: number | null) {
  if (bLat == null || bLng == null) return Number.POSITIVE_INFINITY;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Only show demos if DB truly has zero jobs
  let totalJobs = 0;
  try {
    totalJobs = await prisma.job.count();
  } catch {
    totalJobs = 0;
  }
  const allowDemos = totalJobs === 0;

  // Fetch filtered jobs
  let dbJobs: any[] = [];
  try {
    const where = buildWhere(searchParams);
    dbJobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        location: true,
        photos: { orderBy: { sortOrder: "asc" } },
      },
    });
  } catch {
    dbJobs = [];
  }

  // Optional geo filter
  const lat = parseFloat((searchParams.lat as string) || "NaN");
  const lng = parseFloat((searchParams.lng as string) || "NaN");
  const radius = parseFloat((searchParams.radius as string) || "NaN");

  let withGeo = dbJobs;
  if (!Number.isNaN(lat) && !Number.isNaN(lng) && !Number.isNaN(radius)) {
    withGeo = dbJobs
      .map((j) => {
        const d = milesBetween(lat, lng, j.location?.lat ?? null, j.location?.lng ?? null);
        return { job: j, d };
      })
      .filter((x) => x.d <= radius)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.job);
  }

  const demoMode = allowDemos && withGeo.length === 0;
  const jobs = demoMode ? DEMO_ROWS : withGeo;

  return (
    <div className="space-y-4">
      {/* Filter bar FIRST */}
      <FilterBar />

      {/* Sticky column labels BELOW filter, ABOVE listings */}
      <div className="hidden md:block sticky top-[64px] z-10 rounded-xl border border-slate-800 bg-zinc-950/80 backdrop-blur p-3">
        <div className="flex items-center gap-3">
          <div className="w-[208px]" />
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

      {!demoMode && jobs.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-zinc-950/60 p-3 text-sm text-slate-300">
          No jobs match your filters. Try clearing some filters.
        </div>
      )}

      {/* Listings */}
      <div className="space-y-3">
        {jobs.map((job: any) => {
          const photo = job.photos?.[0]?.url || "/placeholder.jpg";
          const loc = [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "—";
          const schedule = job.schedule ? titleize(job.schedule) : job.employmentType ? titleize(job.employmentType) : "—";
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
                <div className="w-[208px] rounded-lg overflow-hidden border border-slate-800 bg-black shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="w-full h-28 object-cover" />
                </div>

                <div className="grid grid-cols-6 gap-3 flex-1 items-center">
                  <div className="min-w-0">
                    <div className="font-semibold truncate text-slate-100">{job.businessName}</div>
                    <div className="text-sm text-slate-300 line-clamp-2 break-words">{job.title}</div>
                  </div>
                  <div className="text-sm text-slate-100">{titleize(job.role)}</div>
                  <div className="text-sm text-slate-100">{schedule}</div>
                  <div className="text-sm text-slate-100">{exp}</div>
                  <div className="text-sm text-slate-100">{comp}</div>
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
