import Link from "next/link";
import SafeImage from "./SafeImage";

function titleize(v?: string | null) {
  if (!v) return "";
  return String(v)
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function JobCard({ job, href }: { job: any; href: string }) {
  const photo = job.photos?.[0]?.url || "/placeholder.jpg";
  const schedule = job.schedule ? titleize(job.schedule) : "Any";
  const exp = job.experienceText || "Any";
  const comp = job.compModel ? titleize(job.compModel) : "—";
  const loc = [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "—";

  return (
    <div className="rounded-xl border border-slate-800 bg-black/30 hover:bg-black/40">
      <Link href={href} className="block">
        <div className="hidden md:grid grid-cols-[320px_140px_160px_120px_150px_1fr] gap-3 p-2">
          <div className="flex gap-3 items-center">
            <SafeImage src={photo} alt="" className="h-16 w-24 rounded-md object-cover" />
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

        <div className="md:hidden p-3 space-y-2">
          <SafeImage src={photo} alt="" className="h-32 w-full rounded-md object-cover" />
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
}
