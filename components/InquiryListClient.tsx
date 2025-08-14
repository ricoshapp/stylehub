// components/InquiryListClient.tsx
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";

type Item = {
  id: string;
  createdAt?: string;
  name?: string;
  phone?: string;
  note?: string | null;
  job: {
    id: string;
    title: string;
    business: string;
    thumb: string;
    city: string;
  };
};

export default function InquiryListClient({
  mode,
  items,
}: {
  mode: "talent" | "employer";
  items: Item[];
}) {
  const [list, setList] = useState(items || []);
  const [removing, setRemoving] = useState<string | null>(null);

  const onRemove = useCallback(async (id: string) => {
    if (!confirm("Remove this inquiry? This removes it for both sides.")) return;
    setRemoving(id);
    try {
      const resp = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        alert(data?.message || "Failed to remove inquiry.");
      } else {
        setList((prev) => prev.filter((it) => it.id !== id));
      }
    } finally {
      setRemoving(null);
    }
  }, []);

  // Empty states
  if (!list.length) {
    if (mode === "employer") {
      // Employer: no CTA, simple message only
      return (
        <div className="mt-6 rounded-lg border border-white/10 p-6 text-slate-200">
          <p className="text-sm">nothing yet.</p>
        </div>
      );
    }
    // Talent: keep CTA to browse jobs
    return (
      <div className="mt-6 rounded-lg border border-white/10 p-6 text-slate-200">
        <p className="text-sm">No inquiries yet. Find a listing and tap Inquire.</p>
        <div className="mt-3">
          <Link
            href="/jobs"
            className="inline-block rounded-md bg-white px-3 py-2 text-sm font-medium text-black"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-5 space-y-3">
      {list.map((it) => (
        <li
          key={it.id}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
        >
          <img
            src={it.job.thumb || "/placeholder.jpg"}
            alt=""
            className="h-12 w-12 flex-none rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-200">
              <Link
                href={`/jobs/${it.job.id}`}
                className="font-semibold underline-offset-2 hover:underline"
              >
                {it.job.business}
              </Link>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">{it.job.title}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">{it.job.city}</span>
            </div>
            {(it.name || it.phone) && (
              <div className="mt-1 text-xs text-slate-300">
                {it.name ? <span className="mr-2">Name: {it.name}</span> : null}
                {it.phone ? <span>Phone: {formatPhone(it.phone)}</span> : null}
              </div>
            )}
            {it.note && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">{it.note}</p>
            )}
          </div>

          <button
            onClick={() => onRemove(it.id)}
            disabled={removing === it.id}
            className="ml-2 rounded-md border border-white/20 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/10 disabled:opacity-50"
          >
            {removing === it.id ? "Removing…" : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatPhone(v?: string) {
  if (!v) return "";
  const d = v.replace(/\D/g, "").slice(0, 10);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
}
