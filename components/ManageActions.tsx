// components/ManageActions.tsx
"use client";

import { useState } from "react";

export default function ManageActions({
  id,
  status,
}: {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
}) {
  const [busy, setBusy] = useState<null | "pause" | "resume" | "delete">(null);
  const [curr, setCurr] = useState(status);

  async function patch(body: any) {
    const resp = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data?.message || "Failed");
    }
  }

  async function onPause() {
    setBusy("pause");
    try {
      await patch({ status: "PAUSED" });
      setCurr("PAUSED");
    } catch (e: any) {
      alert(e.message || "Failed to pause");
    } finally {
      setBusy(null);
    }
  }

  async function onResume() {
    setBusy("resume");
    try {
      await patch({ status: "ACTIVE" });
      setCurr("ACTIVE");
    } catch (e: any) {
      alert(e.message || "Failed to resume");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setBusy("delete");
    try {
      const resp = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.message || "Failed");
      }
      // Optimistically hide row by reloading the page (simple + robust)
      window.location.reload();
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {curr === "ACTIVE" ? (
        <button
          onClick={onPause}
          disabled={busy !== null}
          className="rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
        >
          {busy === "pause" ? "Pausing…" : "Pause"}
        </button>
      ) : curr === "PAUSED" ? (
        <button
          onClick={onResume}
          disabled={busy !== null}
          className="rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
        >
          {busy === "resume" ? "Resuming…" : "Resume"}
        </button>
      ) : (
        <span className="text-xs text-slate-400">Closed</span>
      )}

      <button
        onClick={onDelete}
        disabled={busy !== null}
        className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        {busy === "delete" ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
