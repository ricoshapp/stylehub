// components/InquirySheet.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type Props = {
  jobId: string;
  open: boolean;
  onClose: () => void;
};

export default function InquirySheet({ jobId, open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // read-only, auto-filled
  const [phone, setPhone] = useState(""); // formatted as (XXX) XXX-XXXX
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok,   setOk]   = useState<string | null>(null);

  // Prefill current user email
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me");
        if (!r.ok) return;
        const { user } = await r.json();
        if (alive && user?.email) setEmail(user.email);
        if (alive && user?.name && !name) setName(user.name);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // Phone formatting that allows deletion at any point
  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 10);
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  }

  const canSubmit = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return name.trim().length > 0 && digits.length === 10;
  }, [name, phone]);

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      // Keep server payload unchanged to avoid breaking existing API:
      // Not sending email yet (UI-only). If we want to store it later,
      // we’ll update the API route + schema safely.
      const res = await fetch("/api/inbox/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          name: name.trim(),
          phone,
          note: note.trim(),
        }),
      });

      if (res.status === 401) {
        // Not signed in — go sign in, then come back to this job
        window.location.href = `/signin?next=/jobs/${jobId}`;
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(t || "Failed to create inquiry.");
        return;
      }

      setOk("Inquiry sent!");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (e: any) {
      setError(e?.message || "Failed to create inquiry.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:max-w-lg bg-zinc-950 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Send an Inquiry</h3>
          <button
            className="p-2 rounded hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Name</label>
            <input
              className="input w-full"
              maxLength={25}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Email</label>
            <input
              className="input w-full opacity-80"
              value={email}
              readOnly
              disabled
              placeholder="(auto from account)"
              title={email ? email : "Auto-filled from your account"}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Phone</label>
            <input
              className="input w-full"
              inputMode="numeric"
              maxLength={14} // (XXX) XXX-XXXX
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Short message</label>
            <textarea
              className="input w-full h-24 resize-none"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional message (max 200)"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          {ok && (
            <div className="text-green-400 text-sm">{ok}</div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-white/10" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              className="rounded-md bg-green-500 text-black px-3 py-1.5 text-sm font-semibold hover:bg-green-400 disabled:opacity-50"
              onClick={submit}
              disabled={!canSubmit || busy}
            >
              {busy ? "Sending…" : "Send Inquiry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
