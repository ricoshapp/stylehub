"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Send } from "lucide-react";

// Format (###) ###-####, but only start formatting once we have 4+ digits.
// This avoids getting "stuck" at exactly 3 digits with parentheses.
function formatPhone(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return d; // no parentheses until 4th digit
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
function phoneDigits(val: string) {
  return val.replace(/\D/g, "").slice(0, 10);
}

export default function JobCTAs({ jobId }: { jobId: string }) {
  const [inquireOpen, setInquireOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // modal fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // formatted value: (###) ###-####
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // favorites (local only)
  useEffect(() => {
    const raw = localStorage.getItem("favorites") || "[]";
    try {
      const ids: string[] = JSON.parse(raw);
      setSaved(ids.includes(jobId));
    } catch {}
  }, [jobId]);

  const toggleSave = () => {
    const raw = localStorage.getItem("favorites") || "[]";
    let ids: string[] = [];
    try {
      ids = JSON.parse(raw);
    } catch {}
    if (ids.includes(jobId)) {
      ids = ids.filter((id) => id !== jobId);
      setSaved(false);
      setMsg("Removed from saved");
    } else {
      ids.push(jobId);
      setSaved(true);
      setMsg("Saved");
    }
    localStorage.setItem("favorites", JSON.stringify(ids));
    setTimeout(() => setMsg(null), 1200);
  };

  // validation rules
  const nameOk = useMemo(() => name.trim().length > 0 && name.trim().length <= 25, [name]);
  const phoneOk = useMemo(() => phoneDigits(phone).length === 10, [phone]);
  const noteOk = useMemo(() => note.trim().length <= 200, [note]);
  const canSubmit = nameOk && phoneOk && noteOk && !busy;

  const onPhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, ""); // keep numeric only
    setPhone(formatPhone(digits));
  };

  const submitInquiry = async () => {
    if (!canSubmit) {
      setErr("Please fill your name (≤25) and a valid 10-digit phone number.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/inbox/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          name: name.trim(),
          phone: phoneDigits(phone), // send digits only
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || `HTTP ${res.status}`);
      }
      setMsg("Inquiry sent!");
      setInquireOpen(false);
      setName("");
      setPhone("");
      setNote("");
    } catch (e: any) {
      setErr(e?.message || "Failed to send inquiry");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 1800);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setInquireOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 text-black px-4 py-2 text-sm font-semibold hover:bg-emerald-400"
      >
        <Send className="h-4 w-4" />
        Inquire
      </button>

      <button
        onClick={toggleSave}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm border ${
          saved
            ? "bg-zinc-900 border-slate-700 text-slate-100"
            : "bg-zinc-950 border-slate-800 text-slate-200 hover:bg-zinc-900"
        }`}
        title={saved ? "Unsave" : "Save"}
      >
        <Bookmark className="h-4 w-4" />
        {saved ? "Saved" : "Save"}
      </button>

      {msg && <span className="ml-2 text-xs text-slate-400">{msg}</span>}

      {/* Modal */}
      {inquireOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-zinc-950 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold">Send an inquiry</h3>
              <p className="text-sm text-slate-400">Your contact details will be shared with the shop.</p>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 25))}
                  className="w-full rounded-lg border border-slate-800 bg-zinc-900 p-2 outline-none"
                  placeholder="Your name"
                  maxLength={25}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Phone number *</label>
                <input
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-zinc-900 p-2 outline-none"
                  placeholder="(555) 123-4567"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <p className="text-[11px] text-slate-500">10 digits; auto-formatted as you type.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">Short message</label>
                  <span className="text-[11px] text-slate-500">{note.length}/200</span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  rows={5}
                  className="w-full rounded-lg border border-slate-800 bg-zinc-900 p-2 outline-none resize-none"
                  placeholder="Optional message to the shop (max 200 characters)"
                  maxLength={200}
                />
              </div>

              {err && <div className="text-sm text-red-400">{err}</div>}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setInquireOpen(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={submitInquiry}
                disabled={!canSubmit}
                className="rounded-lg bg-emerald-500 text-black px-5 py-2 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                {busy ? "Sending..." : "Send inquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
