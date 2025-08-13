// components/InquireButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InquireButton({
  ownerId,
  jobId,
}: {
  ownerId: string;
  jobId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const threadKey = `${ownerId}__${jobId}`;

  async function send() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        body: JSON.stringify({
          toUserId: ownerId,
          jobId,
          body: (note || "Hi! I’m interested in this opportunity.").slice(0, 2000),
        }),
      });

      if (res.status === 401) {
        // not signed in — go sign in, then come back to this job
        router.push(`/signin?next=/jobs/${jobId}`);
        return;
      }

      if (!res.ok) {
        // soft fail — still go to inbox so user can retry
        router.push(`/inbox?threadKey=${encodeURIComponent(threadKey)}`);
        return;
      }

      // success — open inbox focused on this thread
      router.push(`/inbox?threadKey=${encodeURIComponent(threadKey)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className="input w-full h-20 resize-none"
        placeholder="Optional note to include with your inquiry…"
        maxLength={2000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button className="btn" onClick={send} disabled={sending}>
        {sending ? "Sending…" : "Inquire"}
      </button>
    </div>
  );
}
