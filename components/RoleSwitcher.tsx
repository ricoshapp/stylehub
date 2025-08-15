// components/RoleSwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleSwitcher() {
  const router = useRouter();
  const [role, setRole] = useState<"talent" | "employer" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/role", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRole((d.role as any) ?? "talent"))
      .catch(() => setRole("talent"));
  }, []);

  async function choose(next: "talent" | "employer") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to switch role");
      }
      setRole(next);
      // Refresh server components (header) and hard reload as fallback
      router.refresh();
      setTimeout(() => window.location.reload(), 25);
    } catch (e: any) {
      setError(e?.message || "Failed to switch role");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="mb-2 text-sm text-slate-300">Use StyleHub as</div>
      <div className="flex gap-2">
        <button
          onClick={() => choose("talent")}
          disabled={busy}
          aria-pressed={role === "talent"}
          className={
            "rounded-md px-3 py-2 text-sm " +
            (role === "talent"
              ? "bg-white text-black"
              : "border border-white/20 hover:bg-white/10")
          }
        >
          Talent
        </button>
        <button
          onClick={() => choose("employer")}
          disabled={busy}
          aria-pressed={role === "employer"}
          className={
            "rounded-md px-3 py-2 text-sm " +
            (role === "employer"
              ? "bg-white text-black"
              : "border border-white/20 hover:bg-white/10")
          }
        >
          Employer
        </button>
      </div>
      {error && <div className="mt-2 text-sm text-red-300">{error}</div>}
    </div>
  );
}
