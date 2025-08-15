"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CTAButton from "@/components/CTAButton";

type Props = {
  jobId: string;
  open: boolean;
  onClose: () => void;
};

// Format digits -> "(xxx) xxx-xxxx"
function formatPhoneFromDigits(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 10);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
}

export default function InquirySheet({ jobId, open, onClose }: Props) {
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState(""); // raw digits only
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const phoneFormatted = useMemo(() => formatPhoneFromDigits(phoneDigits), [phoneDigits]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && phoneDigits.length === 10;
  }, [name, phoneDigits]);

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/inbox/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          name: name.trim().slice(0, 25),
          phone: phoneDigits, // send raw digits; server can format as needed
          note: (note || "").slice(0, 200),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data?.message ||
            data?.error ||
            "Failed to create inquiry. Please try again."
        );
        return;
      }

      setOk("Inquiry sent!");
      // Optional: close after a short delay
      setTimeout(() => {
        onClose();
        // Clear form
        setName("");
        setPhoneDigits("");
        setNote("");
        setOk(null);
      }, 800);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function onPhoneChange(v: string) {
    // Always derive state from digits; this makes deletion/backspace natural
    const digitsOnly = v.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(digitsOnly);
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet / modal */}
      <div className="relative z-[101] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Send an Inquiry</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm text-white/70">Name</label>
            <input
              type="text"
              inputMode="text"
              placeholder="Your name"
              maxLength={25}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Phone (10 digits)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="(555) 123-4567"
              value={phoneFormatted}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-white/40">
              Area code formats automatically. Only digits are required.
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Short message (optional)
            </label>
            <textarea
              rows={4}
              placeholder="Say hello and share your availability (max 200 chars)…"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status */}
          {(error || ok) && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                error ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {error || ok}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
              disabled={busy}
            >
              Cancel
            </button>
            <CTAButton
              onClick={submit}
              disabled={!canSubmit || busy}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Sending…" : "Send Inquiry"}
            </CTAButton>
          </div>
        </div>
      </div>
    </div>
  );
}
