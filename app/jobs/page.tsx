// app/jobs/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MapPin, BadgeDollarSign, Briefcase, Scissors, Award, Info, Store } from "lucide-react";
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
    // We only persist schedule, show “Any” when null in UI
    if (sched !== "any") where.schedule = sched;
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
        const d = milesBetween(
          lat,
          lng,
          j.location?.lat ?? null,
          j.location?.lng ?? null
        );
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
      <div className="sticky top-[var(--header-bottom,4rem)] z-20 hidden md:grid grid-cols-[320px_140px_160px_120px_150px_1fr] gap-3 px-2 py-2 border-b border-slate-800 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="flex items-center gap-2 text-slate-300">
          <Store className="h-4 w-4" />
          <span className="font-medium">Business &amp; Title</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Scissors className="h-4 w-4" />
          <span className="font-medium">Service</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Briefcase className="h-4 w-4" />
          <span className="font-medium">Schedule</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Award className="h-4 w-4" />
          <span className="font-medium">Experience</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <BadgeDollarSign className="h-4 w-4" />
          <span className="font-medium">Compensation</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">Location</span>
        </div>
      </div>

      {demoMode && (
        <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-amber-100/10 px-3 py-2 text-sm text-amber-200">
          <Info className="h-4 w-4" />
          Showing demo jobs (no records in your database yet). Post one at <code className="px-1">/post</code> to see live data.
        </div>
      )}

      {!demoMode && jobs.length === 0 && (
        <div className="text-sm text-slate-300">No jobs match your filters. Try clearing some filters.</div>
      )}

      {/* Listings */}
      <div className="space-y-3">
        {jobs.map((job: any) => {
          const photo = job.photos?.[0]?.url || "/placeholder.jpg";
          const loc =
            [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "—";
          const schedule =
            job.schedule ? titleize(job.schedule) : "Any"; // <— no employmentType here
          const comp = job.compModel ? titleize(job.compModel) : "—";
          const exp = job.experienceText || "Any";
          const href = demoMode ? "#" : `/jobs/${job.id}`;

          return (
            <div
              key={job.id}
              className="rounded-xl border border-slate-800 bg-black/30 hover:bg-black/40"
            >
              <Link href={href} className="block">
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[320px_140px_160px_120px_150px_1fr] gap-3 p-2">
                  {/* Left: photo + business + title */}
                  <div className="flex gap-3 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt=""
                      className="h-16 w-24 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{job.businessName}</div>
                      <div className="text-sm text-slate-300 line-clamp-2">{job.title}</div>
                    </div>
                  </div>

                  <div className="self-center">{titleize(job.role)}</div>
                  <div className="self-center">{schedule}</div>
                  <div className="self-center">{exp}</div>
                  <div className="self-center">{comp}</div>
                  <div className="self-center">{loc}</div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden p-3 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-32 w-full rounded-md object-cover" />
                  <div className="font-semibold">{job.businessName}</div>
                  <div className="text-sm text-slate-300">{job.title}</div>
                  <div className="text-sm">Service: {titleize(job.role)}</div>
                  <div className="text-sm">Schedule: {schedule}</div>
                  <div className="text-sm">Experience: {exp}</div>
                  <div className="text-sm">Comp: {comp}</div>
                  <div className="text-sm">{loc}</div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
