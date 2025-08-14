"use client";

import { useState, useMemo } from "react";

type Props = {
  jobId: string;
  open: boolean;
  onClose: () => void;
};

export default function InquirySheet({ jobId, open, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // formatted as (XXX) XXX-XXXX
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return name.trim().length > 0 && digits.length === 10;
  }, [name, phone]);

  function formatPhone(next: string) {
    const digits = next.replace(/\D/g, "").slice(0, 10);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 10);
    if (digits.length <= 3) return p1;
    if (digits.length <= 6) return `(${p1}) ${p2}`;
    return `(${p1}) ${p2}-${p3}`;
  }

  async function submit() {
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const resp = await fetch("/api/inbox/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          name: name.trim().slice(0, 25),
          phone: phone.replace(/\D/g, ""),
          note: note.trim().slice(0, 200),
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data?.message || "Failed to send inquiry.");
      } else {
        setOk("Inquiry sent!");
        setTimeout(onClose, 800);
      }
    } catch (e: any) {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3">
          <h2 className="text-xl font-semibold">Send an Inquiry</h2>
          <p className="text-sm text-gray-600">Share your info with the shop owner.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 25))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              placeholder="Your name"
              maxLength={25}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              placeholder="(555) 123-4567"
              inputMode="numeric"
              maxLength={14} // (XXX) XXX-XXXX
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter 10 digits. We’ll share this with the shop.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Short message <span className="text-gray-400">(optional, 200 chars)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              rows={4}
              maxLength={200}
              placeholder="e.g., 3 yrs experience, available Tue–Sat…"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {ok && <p className="mt-3 text-sm text-green-600">{ok}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm text-white ${
              canSubmit ? "bg-black hover:bg-gray-800" : "bg-gray-400"
            }`}
            onClick={submit}
            disabled={!canSubmit || busy}
          >
            {busy ? "Sending…" : "Send Inquiry"}
          </button>
        </div>
      </div>
    </div>
  );
}
