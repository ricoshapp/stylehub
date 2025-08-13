"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CTAButton from "@/components/CTAButton";

function useSaved(jobId: string) {
  const KEY = "stylehub:savedJobs";
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setSaved(arr.includes(jobId));
    } catch {}
  }, [jobId]);

  const toggle = () => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = arr.includes(jobId) ? arr.filter((id) => id !== jobId) : [...arr, jobId];
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(next.includes(jobId));
    } catch {}
  };

  return { saved, toggle };
}

export default function JobActions({ jobId, shopName }: { jobId: string; shopName?: string | null }) {
  const { saved, toggle } = useSaved(jobId);

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const title = useMemo(() => (shopName ? `Inquire at ${shopName}` : "Inquire"), [shopName]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setSending(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      jobId,
      name: (fd.get("name") as string)?.trim() || "",
      email: (fd.get("email") as string)?.trim() || "",
      phone: (fd.get("phone") as string)?.trim() || "",
      note: (fd.get("note") as string)?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    try {
      const KEY = "stylehub:inquiries";
      const raw = localStorage.getItem(KEY);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      arr.push(payload);
      localStorage.setItem(KEY, JSON.stringify(arr));
      setOk("Inquiry sent! We'll wire inbox/email next.");
      (e.currentTarget as HTMLFormElement).reset();
      setTimeout(() => setOpen(false), 800);
    } catch {
      setOk("Saved locally (demo).");
      setTimeout(() => setOpen(false), 800);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <CTAButton type="button" onClick={() => setOpen(true)}>
          Inquire
        </CTAButton>
        <CTAButton
          type="button"
          variant="secondary"
          onClick={toggle}
          aria-pressed={saved}
          title={saved ? "Remove from saved" : "Save this job"}
        >
          {saved ? "Saved" : "Save"}
        </CTAButton>
      </div>

      {mounted && open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-zinc-950 p-5 shadow-2xl">
              <div className="text-lg font-semibold text-slate-100">{title}</div>
              <div className="mt-1 text-sm text-slate-400">
                Share your contact info and a short note. We’ll route this to the shop (demo mode for now).
              </div>

              <form onSubmit={submit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name</label>
                  <input name="name" className="input" placeholder="Your name" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Email</label>
                    <input name="email" type="email" className="input" placeholder="you@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Phone</label>
                    <input name="phone" className="input" placeholder="(555) 555-5555" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Note</label>
                  <textarea name="note" className="input min-h-[100px]" placeholder="Quick intro, availability, portfolio link…" />
                </div>

                {ok && <div className="text-sm text-emerald-300">{ok}</div>}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button type="button" className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-zinc-900" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <CTAButton type="submit" disabled={sending}>
                    {sending ? "Sending…" : "Send Inquiry"}
                  </CTAButton>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
