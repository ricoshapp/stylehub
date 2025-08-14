// components/InquiryListClient.tsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Item = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  note: string | null;
  job: {
    id: string;
    title: string;
    business: string;
    thumb: string;
    city: string;
  };
};

export default function InquiryListClient({
  mode, // "talent" | "employer"
  items,
}: {
  mode: "talent" | "employer";
  items: Item[];
}) {
  const [list, setList] = useState(items);
  const [isPending, startTransition] = useTransition();

  async function remove(id: string) {
    startTransition(async () => {
      const prev = list;
      setList((l) => l.filter((x) => x.id !== id));
      try {
        const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
      } catch (e) {
        // revert on error
        setList(prev);
        alert("Failed to remove inquiry. Please try again.");
      }
    });
  }

  if (!list.length) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-slate-300">No inquiries yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {list.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <img
            src={it.job.thumb || "/placeholder.jpg"}
            alt=""
            className="h-16 w-16 rounded-lg object-cover border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                href={`/jobs/${it.job.id}`}
                className="font-semibold text-white hover:underline truncate"
                title={it.job.business}
              >
                {it.job.business}
              </Link>
              <span className="text-slate-400 text-sm truncate" title={it.job.title}>
                {it.job.title}
              </span>
              <span className="text-slate-400 text-sm">{it.job.city}</span>
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {/* Show the inquiry payload (what talent sent) */}
              <div className="flex flex-wrap gap-3">
                <span><strong>Name:</strong> {it.name || "—"}</span>
                <span><strong>Phone:</strong> {formatPhone(it.phone) || "—"}</span>
                {it.note ? (
                  <span className="truncate">
                    <strong>Message:</strong> {it.note}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/jobs/${it.job.id}`}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
              title="Open job"
            >
              View
            </Link>
            <button
              onClick={() => remove(it.id)}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-50"
              title="Remove inquiry"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatPhone(d: string) {
  const s = (d || "").replace(/\D/g, "");
  if (s.length <= 3) return s;
  if (s.length <= 6) return `(${s.slice(0, 3)}) ${s.slice(3)}`;
  return `(${s.slice(0, 3)}) ${s.slice(3, 6)}-${s.slice(6, 10)}`;
}
