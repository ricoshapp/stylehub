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
  jobId: string;       // <-- used for linking
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

  const withFlags = useMemo(() => {
    const now = Date.now();
    return local.map((x) => {
      const ageMs = Math.max(0, now - (x.createdAt ? new Date(x.createdAt).getTime() : now));
      const isNew = ageMs < 48 * 60 * 60 * 1000; // 48h
      return { ...x, isNew };
    });
  }, [local]);

  const remove = (id: string) => {
    // optimistic
    const prev = local;
    setLocal((cur) => cur.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setLocal(prev); // revert
        alert("Failed to remove inquiry. Please try again.");
      }
    });
  };

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">
          {roleView === "employer"
            ? "Nothing yet."
            : "No inquiries yet. Find a listing and tap Inquire."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {withFlags.map((x) => {
        const hasJob = Boolean(x.jobId);
        const heading = (
          <div className="leading-tight">
            <div className="font-medium">
              {hasJob ? (
                <Link href={`/jobs/${x.jobId}`} className="hover:underline">
                  {x.businessName || x.jobTitle || "Listing"}
                </Link>
              ) : (
                <span className="opacity-70">Deleted listing</span>
              )}
              {x.isNew && (
                <span className="ml-2 inline-flex items-center rounded-md bg-green-600/20 px-2 py-0.5 text-xs text-green-300 align-middle">
                  New
                </span>
              )}
            </div>
            <div className="text-sm text-white/70">
              {x.jobTitle}
              {x.cityState ? ` · ${x.cityState}` : ""}
            </div>
          </div>
        );

        return (
          <div
            key={x.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">{heading}</div>

            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-white/50">Name</div>
                <div className="font-medium">{x.name || "—"}</div>
              </div>
              <div>
                <div className="text-white/50">Phone</div>
                <div className="font-medium">{x.phone || "—"}</div>
              </div>
              <div>
                <div className="text-white/50">Message</div>
                <div className="font-medium line-clamp-2 max-w-[28ch]">{x.note || "—"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-white/40">
                {new Date(x.createdAt).toLocaleString()}
              </div>
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
        );
      })}
    </div>
  );
}
