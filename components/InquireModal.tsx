"use client";

import { useState } from "react";

export default function InquireModal({
  jobId,
  open,
  onClose,
}: {
  jobId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, note }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || `HTTP ${res.status}`);
      }
      setDone(true);
      setTimeout(onClose, 900);
    } catch (e: any) {
      setErr(e?.message || "Failed to send enquiry");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold">Send an enquiry</h3>
          <p className="text-sm text-slate-400">Optional note to the shop (max 500 characters).</p>
        </div>
        <div className="p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={5}
            className="w-full rounded-lg border border-slate-800 bg-zinc-900 p-2 outline-none"
            placeholder="Your note..."
          />
          {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
          {done && <div className="mt-2 text-sm text-emerald-400">Sent!</div>}
        </div>
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-zinc-900">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-lg bg-emerald-500 text-black px-5 py-2 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60">
            {busy ? "Sending..." : "Inquire"}
          </button>
        </div>
      </div>
    </div>
  );
}
