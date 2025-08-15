// app/jobs/manage/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import ManageActions from "@/components/ManageActions";

export const dynamic = "force-dynamic";

export default async function ManageJobsPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-slate-100">
        <h1 className="text-2xl font-bold">Manage Listings</h1>
        <p className="mt-2 text-slate-300">Please sign in.</p>
      </div>
    );
  }

  // Ensure the user has an employer profile
  const employer = await prisma.employerProfile.findFirst({
    where: { userId: me.id },
    select: { id: true },
  });

  if (!employer) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-slate-100">
        <h1 className="text-2xl font-bold">Manage Listings</h1>
        <p className="mt-2 text-slate-300">
          You need an employer profile to manage listings.
        </p>
        <div className="mt-4">
          <Link
            href="/post"
            className="inline-block rounded-md bg-white px-3 py-2 text-sm font-medium text-black"
          >
            Create your first listing
          </Link>
        </div>
      </div>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { employerProfile: { userId: me.id } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      businessName: true,
      status: true,
      viewsCount: true,
      inquiriesCount: true,
      createdAt: true,
      location: { select: { city: true, state: true } },
      photos: { select: { url: true }, take: 1 },
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Listings</h1>
        <Link
          href="/post"
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black"
        >
          Post a Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-6">
          <p className="text-slate-300">No listings yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-slate-300">
              <tr>
                <th className="px-4 py-2">Listing</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Views</th>
                <th className="px-4 py-2">Inquiries</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={j.photos?.[0]?.url ?? "/placeholder.jpg"}
                        className="h-12 w-12 rounded-md object-cover"
                        alt=""
                      />
                      <div>
                        <div className="font-medium text-slate-100">
                          {j.businessName || "Business"}
                        </div>
                        <div className="text-slate-300">{j.title}</div>
                        <div className="text-xs text-slate-400">
                          {[j.location?.city, j.location?.state]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                        (j.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-300"
                          : j.status === "PAUSED"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-slate-500/20 text-slate-300")
                      }
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{j.viewsCount ?? 0}</td>
                  <td className="px-4 py-3">{j.inquiriesCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                      >
                        View
                      </Link>
                      {/* Edit can point to /post?edit=<id> later */}
                      <ManageActions id={j.id} status={j.status as "ACTIVE" | "PAUSED" | "CLOSED"} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
