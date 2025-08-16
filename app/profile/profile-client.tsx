"use client";

import { useState } from "react";

type Me = {
  id: string;
  name: string;
  role: "talent" | "employer";
};

export default function ProfileClient({ me }: { me: Me }) {
  const [name, setName] = useState(me.name ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const roleLabel = me.role === "employer" ? "Employer" : "Talent";

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only update name; role is controlled via the top RoleSwitcher
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Saved!");
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">
          Using StyleHub as: <strong>{roleLabel}</strong>
        </span>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Display name</label>
          <input
            className="input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="Your name or shop name"
          />
          <div className="mt-1 text-xs text-white/50">{name.length}/50</div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <a href="/signout" className="text-sm underline opacity-80 hover:opacity-100">
            Sign out
          </a>
          {msg && (
            <span className={`text-sm ${msg === "Saved!" ? "text-emerald-400" : "text-rose-400"}`}>
              {msg}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
