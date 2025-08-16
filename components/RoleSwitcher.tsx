"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type RoleView = "talent" | "employer";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function RoleSwitcher() {
  const router = useRouter();
  const [role, setRole] = useState<RoleView | null>(null);
  const [isPending, startTransition] = useTransition();

  // Initialize from cookie; fall back to server default via /api/auth/me
  useEffect(() => {
    const fromCookie = readCookie("roleView") as RoleView | null;
    if (fromCookie === "talent" || fromCookie === "employer") {
      setRole(fromCookie);
      return;
    }
    // Fallback to server-stored role
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const r = (json?.user?.role as RoleView) ?? "talent";
          setRole(r);
        } else {
          setRole("talent");
        }
      } catch {
        setRole("talent");
      }
    })();
  }, []);

  async function pick(next: RoleView) {
    if (role === next || isPending) return;
    setRole(next); // optimistic
    try {
      await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleView: next }),
      });
    } finally {
      // Ensure all server components (e.g., header links, /inbox copy) pick up cookie
      startTransition(() => router.refresh());
    }
  }

  const isTalent = role === "talent";
  const isEmployer = role === "employer";

  return (
    <div className="mb-6">
      <p className="text-sm mb-2">Use StyleHub as</p>
      <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          aria-pressed={isTalent}
          onClick={() => pick("talent")}
          className={`px-3 py-1.5 rounded-lg text-sm transition
            ${isTalent ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
        >
          Talent
        </button>
        <button
          type="button"
          aria-pressed={isEmployer}
          onClick={() => pick("employer")}
          className={`px-3 py-1.5 rounded-lg text-sm transition
            ${isEmployer ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
        >
          Employer
        </button>
      </div>
    </div>
  );
}
