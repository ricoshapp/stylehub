// components/AuthLinks.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AuthLinks() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setAuthed(!!d?.user))
      .catch(() => alive && setAuthed(null));
    return () => { alive = false; };
  }, []);

  if (authed === true) return null;

  return (
    <div className="flex items-center gap-4">
      <Link href="/signin" className="hover:text-white/90">Sign in</Link>
      <Link href="/signup" className="hover:text-white/90">Sign up</Link>
    </div>
  );
}
