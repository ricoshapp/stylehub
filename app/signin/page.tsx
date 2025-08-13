// app/signin/page.tsx
"use client";

import { useState } from "react";
import CTAButton from "@/components/CTAButton";
import FormField from "@/components/FormField";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 && data?.redirect) {
          setMsg("No account found. Please create one.");
        } else {
          throw new Error(data?.error || "Login failed");
        }
        return;
      }
      window.location.href = "/profile";
    } catch (err: any) {
      setMsg(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {msg && <div className="card p-3 text-slate-200">{msg}</div>}

      <form onSubmit={onSubmit} className="card p-5 space-y-4">
        <FormField label="Email">
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        <div className="flex gap-3">
          <CTAButton type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </CTAButton>
          <CTAButton href="/jobs" variant="secondary">
            Cancel
          </CTAButton>
        </div>
      </form>

      <div className="text-sm text-slate-400">
        Don’t have an account?{" "}
        <Link href="/signup" className="underline">
          Create one
        </Link>
        .
      </div>
    </div>
  );
}
