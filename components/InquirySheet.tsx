// components/InquirySheet.tsx
"use client";

import { useState } from "react";

export default function InquirySheet({ jobId, jobTitle }: { jobId: string; jobTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState(""); // digits only
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const phoneFmt = formatPhone(phoneRaw);

  function onPhoneChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    setPhoneRaw(digits);
  }

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!name.trim() || phoneRaw.length !== 10) {
      setErr("Enter your name and a 10-digit phone.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/inbox/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId,
          name: name.trim(),
          phone: phoneRaw,
          note: note.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to send");
      setMsg("Inquiry sent! We’ll notify the shop.");
      setName("");
      setPhoneRaw("");
      setNote("");
      // keep sheet open so user sees confirmation
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
      >
        Inquire
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* sheet */}
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-white/10 p-5 m-0 sm:m-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Send an inquiry</h3>
                {jobTitle ? (
                  <p className="text-slate-400 text-sm mt-0.5 break-words">{jobTitle}</p>
                ) : null}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 25))}
                  maxLength={25}
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Phone</label>
                <input
                  inputMode="numeric"
                  value={phoneFmt}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  placeholder="(555) 123-4567"
                />
                <p className="text-xs text-slate-400 mt-1">Digits only; formatted as you type.</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Message <span className="text-slate-400">(optional, 200 chars)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  maxLength={200}
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-500 resize-none"
                  rows={4}
                  placeholder="Short note to the shop…"
                />
              </div>

              {err ? <p className="text-red-400 text-sm">{err}</p> : null}
              {msg ? <p className="text-emerald-400 text-sm">{msg}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={submitting || !name.trim() || phoneRaw.length !== 10}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending…" : "Send Inquiry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
