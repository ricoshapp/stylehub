// components/JobCard.tsx
"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";

function titleize(v?: string | null) {
  if (!v) return "";
  return v.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}
function humanSchedule(schedule?: string | null) {
  if (!schedule) return "";
  if (schedule === "full_time") return "Full Time";
  if (schedule === "part_time") return "Part Time";
  return titleize(schedule);
}
function scheduleEmploymentLabel(schedule?: string | null, employmentType?: "w2" | "c1099" | null) {
  const s = humanSchedule(schedule);
  const e = employmentType === "c1099" ? "Independent Contractor" : employmentType === "w2" ? "Employee" : "";
  if (s && e) return `${s} • ${e}`;
  if (s) return s;
  if (e) return e;
  return "Any";
}
function leadPhoto(job: any): string {
  const urls = (job.photos ?? []).map((p: any) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
  return urls[0] || "/placeholder.jpg";
}

export default function JobCard({ job }: { job: any }) {
  const pay =
    job?.payVisible === false ? "Hidden" :
    job?.compModel === "hybrid" && job?.payMin != null && job?.payMax != null ? `${job.payMin}% + ${job.payMax} ${job.payUnit || "$/hr"}` :
    job?.compModel === "commission" && job?.payMin != null ? `${job.payMin}%` :
    job?.payMin != null && job?.payUnit ? `${job.payMin} ${job.payUnit}` : "—";

  const schedEmp = scheduleEmploymentLabel(job.schedule, job.employmentType);
  const experience = (job.experienceText ?? "").trim() || "Any";

  return (
    <Link href={`/jobs/${job.id}`} className="block focus:outline-none hover:bg-white/5 transition">
      <div className="grid items-center gap-3 p-3 grid-cols-[150px_1.4fr_1fr_1.2fr_1fr_1fr_1.2fr_1fr]">
        <div className="relative w-[150px] h-[110px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
          <SafeImage src={leadPhoto(job)} alt="" className="h-full w-full object-cover" />
        </div>

        {/* Business + multi-line short title */}
        <div className="min-w-0">
          <div className="font-semibold text-slate-100 text-sm text-center break-words">
            {job.employerProfile?.shopName || "—"}
          </div>
          <div className="text-xs text-slate-300 mt-0.5 whitespace-normal break-words">
            {job.title || "—"}
          </div>
        </div>

        <div className="min-w-0 text-sm text-slate-100 truncate">{titleize(job.role) || "—"}</div>
        <div className="min-w-0 text-sm text-slate-100 truncate">{schedEmp}</div>
        <div className="min-w-0 text-sm text-slate-100 truncate">{experience}</div>
        <div className="min-w-0 text-sm text-slate-100 truncate">{titleize(job.compModel) || "—"}</div>
        <div className="min-w-0 text-sm text-slate-100 truncate">{pay}</div>
        <div className="min-w-0 text-sm text-slate-100 truncate">
          {job.location?.city ? `${job.location.city}, ${job.location?.state || "CA"}` : "San Diego, CA"}
        </div>
      </div>
    </Link>
  );
}
