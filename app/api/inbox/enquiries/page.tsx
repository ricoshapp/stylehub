import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Scissors, Briefcase, User2 } from "lucide-react";

// tiny util
function titleize(v?: string | null) {
  if (!v) return "";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default async function EnquiriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Enquiries</h1>
        <p className="text-slate-400">Please sign in to view your enquiries.</p>
      </div>
    );
  }

  if (user.role === "talent") {
    // Jobs I've inquired on
    const items = await prisma.inquiry.findMany({
      where: { senderId: user.id },
      orderBy: { createdAt: "desc" },
      include: { job: { include: { location: true, photos: true } } },
    });

    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your Enquiries</h1>
          <p className="text-slate-400 text-sm">{items.length} {items.length === 1 ? "result" : "results"}</p>
        </div>

        {/* header row */}
        <div className="hidden md:grid grid-cols-[3fr,2fr,2fr,2fr] gap-4 text-xs uppercase tracking-wide text-slate-400 px-3">
          <div className="flex items-center gap-2"><Scissors className="h-4 w-4" /> Job</div>
          <div>Schedule</div>
          <div>Service</div>
          <div>Location</div>
        </div>

        <div className="space-y-3">
          {items.map(({ id, job }) => {
            const photo = job.photos?.[0]?.url || "/placeholder.jpg";
            const city = job.location?.city || "San Diego";
            const sched = titleize(job.schedule || "");
            return (
              <Link key={id} href={`/jobs/${job.id}`}>
                <div className="rounded-xl border border-slate-800 bg-zinc-950 hover:bg-zinc-900 transition p-3">
                  <div className="grid md:grid-cols-[3fr,2fr,2fr,2fr] gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Image src={photo} alt="" width={64} height={48} className="rounded-lg object-cover w-16 h-12" />
                      <div>
                        <div className="font-semibold text-slate-100">{job.businessName || "—"}</div>
                        <div className="text-slate-300 text-sm line-clamp-1">{job.title}</div>
                      </div>
                    </div>
                    <div className="text-slate-200 text-sm">{sched || "Any"}</div>
                    <div className="text-slate-200 text-sm">{titleize(job.role)}</div>
                    <div className="text-slate-200 text-sm">{city}</div>
                  </div>
                </div>
              </Link>
            );
          })}

          {items.length === 0 && (
            <div className="text-slate-400">You haven’t enquired on any jobs yet.</div>
          )}
        </div>
      </div>
    );
  }

  // Employer view: enquiries I’ve received
  const items = await prisma.inquiry.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, businessName: true, role: true } },
      sender: { select: { id: true, username: true, email: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Incoming Enquiries</h1>
        <p className="text-slate-400 text-sm">{items.length} {items.length === 1 ? "result" : "results"}</p>
      </div>

      {/* header row */}
      <div className="hidden md:grid grid-cols-[2fr,3fr,3fr,2fr] gap-4 text-xs uppercase tracking-wide text-slate-400 px-3">
        <div className="flex items-center gap-2"><User2 className="h-4 w-4" /> Sender</div>
        <div className="flex items-center gap-2"><Scissors className="h-4 w-4" /> Note</div>
        <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job</div>
        <div>Service</div>
      </div>

      <div className="space-y-3">
        {items.map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-800 bg-zinc-950 p-3">
            <div className="grid md:grid-cols-[2fr,3fr,3fr,2fr] gap-4 items-center">
              <div className="text-slate-100">
                <div className="font-semibold">{row.sender.username || row.sender.email || row.sender.id}</div>
                <div className="text-xs text-slate-400">{row.sender.email}</div>
              </div>
              <div className="text-slate-200 text-sm whitespace-pre-wrap break-words">{row.note || "—"}</div>
              <div className="text-slate-200 text-sm">
                <Link href={`/jobs/${row.job.id}`} className="underline hover:text-white">
                  {row.job.businessName || "—"} — {row.job.title}
                </Link>
              </div>
              <div className="text-slate-200 text-sm">{titleize(row.job.role)}</div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-slate-400">No enquiries yet.</div>
        )}
      </div>
    </div>
  );
}
