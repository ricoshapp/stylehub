// app/jobs/manage/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

// helper: time left as string (7-day expiry badge)
function timeLeft(expiresAt: Date) {
  const ms = +new Date(expiresAt) - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  const days = Math.ceil(hours / 24);
  return `${days}d left`;
}

export default async function ManageJobsPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Manage Listings</h1>
        <p className="opacity-80">Please sign in as an employer to manage your listings.</p>
      </div>
    );
  }

  // Employer-only: jobs where employerProfile.userId = me.id
  const jobs = await prisma.job.findMany({
    where: { employerProfile: { userId: me.id } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      businessName: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      location: { select: { city: true, state: true } },
      photos: { select: { url: true }, take: 1 },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">Manage Listings</h1>
        <Link
          href="/post"
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          + New Listing
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 p-6 text-sm opacity-80">
          You haven’t posted any listings yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-black/20">
          {jobs.map((j) => {
            const photo = j.photos[0]?.url || "/placeholder.jpg";
            const left = j.expiresAt ? timeLeft(j.expiresAt as any) : undefined;
            const expired = left === "expired";

            return (
              <div key={j.id} className="grid grid-cols-[110px_1fr_auto] gap-4 p-4 sm:gap-6 sm:p-5">
                {/* thumb */}
                <img
                  src={photo}
                  alt=""
                  className="h-20 w-28 rounded-md border border-slate-800 object-cover"
                />

                {/* main */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                      href={`/jobs/${j.id}`}
                      className="truncate text-base font-medium hover:underline"
                      title={j.title}
                    >
                      {j.businessName} — {j.title}
                    </Link>
                    <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-[11px] uppercase tracking-wide opacity-80">
                      {j.status ?? "ACTIVE"}
                    </span>
                    {left && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                          expired
                            ? "border border-red-500/40 bg-red-500/10 text-red-300"
                            : "border border-red-500/30 bg-red-500/5 text-red-200"
                        }`}
                        title={j.expiresAt?.toString()}
                      >
                        {left}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm opacity-80">
                    {j.location?.city ? `${j.location.city}, ${j.location.state || "CA"}` : "—"}
                  </div>
                </div>

                {/* actions */}
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/jobs/${j.id}`}
                    className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
                  >
                    View
                  </Link>
                  {/* you can add Pause/Delete later */}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
