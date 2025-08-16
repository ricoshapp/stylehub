// components/InquiryListClient.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

type Item = {
  id: string;
  createdAt: string; // ISO
  name: string;
  phone: string;
  note: string;
  jobId: string;
  jobTitle: string;
  businessName: string;
  cityState: string;
};

export default function InquiryListClient({
  roleView,
  items,
}: {
  roleView: "talent" | "employer";
  items: Item[];
}) {
  const [local, setLocal] = useState(items);
  const [pending, startTransition] = useTransition();

  const isEmpty = local.length === 0;

  const remove = (id: string) => {
    // optimistic
    setLocal((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // revert if failed
        setLocal(items);
        alert("Failed to remove inquiry. Please try again.");
      }
    });
  };

  const now = Date.now();
  const withFlags = useMemo(
    () =>
      local.map((x) => {
        const ageMs = Math.max(
          0,
          now - (x.createdAt ? new Date(x.createdAt).getTime() : now)
        );
        const isNew = ageMs < 48 * 60 * 60 * 1000; // 48h
        return { ...x, isNew };
      }),
    [local, now]
  );

  return (
    <div className="space-y-3">
      {isEmpty ? (
        <div className="rounded-xl border border-slate-800 bg-black/20 p-6 text-slate-300">
          {roleView === "employer" ? (
            <span>Nothing yet.</span>
          ) : (
            <span>No inquiries yet. Find a listing and tap Inquire.</span>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {withFlags.map((x) => (
            <li
              key={x.id}
              className="rounded-xl border border-slate-800 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${x.jobId}`}
                      className="font-semibold hover:underline"
                    >
                      {x.businessName || x.jobTitle || "Listing"}
                    </Link>
                    {x.isNew && (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {x.jobTitle}
                    {x.cityState ? ` · ${x.cityState}` : ""}
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-slate-400">Name</div>
                      <div className="font-medium">{x.name || "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Phone</div>
                      <div className="font-medium">{x.phone || "—"}</div>
                    </div>
                    <div className="sm:col-span-3">
                      <div className="text-slate-400">Message</div>
                      <div className="font-medium whitespace-pre-wrap">
                        {x.note || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => remove(x.id)}
                    disabled={pending}
                    className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                    title="Remove inquiry (removes for both sides)"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                {new Date(x.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
