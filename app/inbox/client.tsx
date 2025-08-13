// app/inbox/client.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Me = { id: string; name: string | null; role: "employer" | "talent" | "admin" } | null;

type Thread = {
  key: string; // "<otherId>__<jobId|none>"
  otherUser: { id: string; name: string | null; username: string | null };
  job: { id: string; title: string; businessName: string | null } | null;
  lastMessage: { body: string; createdAt: string; fromMe: boolean };
};

type Msg = { id: string; body: string; createdAt: string; fromMe: boolean };

export default function InboxClient({
  me,
  initialThreadKey = null,
}: {
  me: Me;
  initialThreadKey?: string | null;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(initialThreadKey);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const pollRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Load threads
  useEffect(() => {
    if (!me) return;
    fetch("/api/inbox/threads", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list: Thread[] = d.threads || [];
        setThreads(list);

        // If we were passed an initial thread, prefer it
        if (initialThreadKey) {
          setActiveKey(initialThreadKey);
        } else if (list.length > 0 && !activeKey) {
          setActiveKey(list[0].key);
        }
      })
      .catch(() => setThreads([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // Load messages for active thread
  useEffect(() => {
    if (!activeKey) return;
    loadMessages(activeKey);
    clearInterval(pollRef.current as any);
    pollRef.current = window.setInterval(() => loadMessages(activeKey), 5000);
    return () => clearInterval(pollRef.current as any);
  }, [activeKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages(key: string) {
    try {
      const r = await fetch(`/api/inbox/messages?threadKey=${encodeURIComponent(key)}`, { cache: "no-store" });
      const d = await r.json();
      if (r.ok) setMessages(d.messages || []);
    } catch {}
  }

  async function send() {
    if (!input.trim() || !activeKey) return;
    const text = input.trim();
    setLoading(true);
    try {
      const r = await fetch("/api/inbox/send", {
        method: "POST",
        body: JSON.stringify({ threadKey: activeKey, body: text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Send failed");
      setMessages((prev) => [...prev, d.message]);
      setInput("");
      // optimistic update of preview
      setThreads((prev) =>
        prev.map((t) =>
          t.key === activeKey
            ? { ...t, lastMessage: { body: text, createdAt: new Date().toISOString(), fromMe: true } }
            : t
        )
      );
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (!me) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 p-6">
          <p className="text-slate-200">Please sign in to view your messages.</p>
          <div className="mt-4 flex gap-3">
            <Link className="btn" href="/signin">Sign in</Link>
            <Link className="btn-secondary" href="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Threads */}
      <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-800 font-semibold">Conversations</div>
        <div className="flex-1 overflow-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">No messages yet.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveKey(t.key)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-zinc-900 ${
                  activeKey === t.key ? "bg-zinc-900" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {t.otherUser.name || `@${t.otherUser.username || "user"}`}
                    </div>
                    {t.job && (
                      <div className="text-xs text-slate-400 truncate">
                        {t.job.businessName ? `${t.job.businessName} — ` : ""}
                        {t.job.title}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 shrink-0">
                    {new Date(t.lastMessage.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-1 text-sm text-slate-300 line-clamp-1">
                  {t.lastMessage.fromMe ? "You: " : ""}{t.lastMessage.body}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-zinc-950/60 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-800 font-semibold">
          {activeKey
            ? (() => {
                const t = threads.find((x) => x.key === activeKey);
                if (!t) return "Conversation";
                return t.job
                  ? `${t.otherUser.name || `@${t.otherUser.username || "user"}`} · ${t.job.businessName || ""} — ${t.job.title}`
                  : `${t.otherUser.name || `@${t.otherUser.username || "user"}`}`;
              })()
            : "Select a conversation"}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {!activeKey ? (
            <div className="text-slate-400">Choose a conversation on the left.</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-400">No messages yet. Say hi!</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`max-w-[80%] ${m.fromMe ? "ml-auto text-right" : ""}`}>
                <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${m.fromMe ? "bg:white text-black bg-white" : "bg-zinc-900 border border-slate-800 text-slate-100"}`}>
                  {m.body}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder={activeKey ? "Type a message…" : "Select a conversation to start…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!activeKey || loading}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (activeKey) send();
                }
              }}
            />
            <button
              className="btn"
              onClick={send}
              disabled={!activeKey || loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
