// app/profile/profile-client.tsx
"use client";

import { useState } from "react";

type Me = { id: string; name: string; role: "employer" | "talent" | "admin" };

export default function ProfileClient({ me }: { me: Me }) {
  const [name, setName] = useState(me.name || "");
  const [role, setRole] = useState<"employer" | "talent">(me.role === "employer" ? "employer" : "talent");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch("/api/profile/update", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() || null, role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Save failed");
      setMsg("Saved ✓");
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/signin";
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Your Profile</h1>
      {msg && <div className="card p-3 text-slate-200">{msg}</div>}

      <div className="card p-5 space-y-4">
        <label className="block">
          <div className="mb-1 text-sm text-slate-300">Display name</div>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>

        <div className="block">
          <div className="mb-1 text-sm text-slate-300">I am a</div>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" value="employer" checked={role === "employer"} onChange={() => setRole("employer")} />
              <span>Business / Employer</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" value="talent" checked={role === "talent"} onChange={() => setRole("talent")} />
              <span>Talent</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          <button className="btn-secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
