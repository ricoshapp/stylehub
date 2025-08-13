"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* minimal inline UI (no external components to avoid import issues) */
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string; variant?: "primary"|"secondary" }) {
  const { href, variant="primary", className="", ...rest } = props as any;
  const cls =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition " +
    (variant === "secondary"
      ? "border border-slate-700 bg-zinc-950/30 hover:bg-zinc-900/50"
      : "bg-white text-black hover:bg-zinc-200");
  if (href) return <Link href={href} className={`${cls} ${className}`}>{props.children}</Link>;
  return <button className={`${cls} ${className}`} {...rest} />;
}
function Field({
  label, hint, children
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-slate-300">{label}{hint && <span className="ml-2 text-xs text-slate-500">{hint}</span>}</div>
      {children}
    </label>
  );
}

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return Math.min(s, 4);
}
const strengthLabel = ["Very weak","Weak","Okay","Good","Strong"];

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<"idle"|"checking"|"ok"|"taken"|"invalid"|"reserved">("idle");
  const [email, setEmail] = useState(""); // optional
  const [role, setRole] = useState<"employer"|"talent">("employer");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  const pwScore = useMemo(() => scorePassword(pw), [pw]);
  const pwMatch = pw.length > 0 && pw === pw2;

  // Debounced username availability check (tolerant)
  useEffect(() => {
    if (!username) { setUsernameState("idle"); return; }
    const t = setTimeout(async () => {
      setUsernameState("checking");
      try {
        const res = await fetch(`/api/auth/check-username?u=${encodeURIComponent(username)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.ok) { setUsernameState("checking"); return; }
        if (data.reason === "reserved") setUsernameState("reserved");
        else setUsernameState(data.available ? "ok" : "taken");
      } catch { setUsernameState("checking"); }
    }, 350);
    return () => clearTimeout(t);
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (usernameState !== "ok") { setMsg("Please choose an available username."); setBusy(false); return; }
      if (!pwMatch) { setMsg("Passwords don’t match."); setBusy(false); return; }
      if (pwScore < 2) { setMsg("Please choose a stronger password."); setBusy(false); return; }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password: pw, email: email || null, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");
      window.location.href = "/profile";
    } catch (err: any) {
      setMsg(err?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      {msg && <div className="rounded-xl border border-slate-800 bg-zinc-950/60 p-3 text-slate-200">{msg}</div>}

      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-800 bg-zinc-950/50 p-5 space-y-4">
        <Field label="Username" hint="3–20 chars; letters, numbers, dot, underscore, hyphen.">
          <input
            className="input"
            placeholder="yourname"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            maxLength={20}
            required
          />
          <div className="mt-1 text-xs">
            {usernameState === "idle" && <span className="text-slate-500">Pick a unique username.</span>}
            {usernameState === "checking" && <span className="text-slate-400">Checking…</span>}
            {usernameState === "ok" && <span className="text-green-400">Available ✓</span>}
            {usernameState === "taken" && <span className="text-rose-400">Already taken</span>}
            {usernameState === "reserved" && <span className="text-rose-400">Reserved</span>}
            {usernameState === "invalid" && <span className="text-rose-400">Invalid username</span>}
          </div>
        </Field>

        <Field label="Email (optional)" hint="Add email to receive notifications later.">
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Password" hint="8+ chars; upper, lower, number, symbol.">
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
          <div className="mt-2">
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded ${i < pwScore ? "bg-green-500" : "bg-slate-700"}`} />
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-1">{strengthLabel[pwScore]}</div>
          </div>
        </Field>

        <Field label="Confirm Password">
          <input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
          {!pwMatch && pw2.length > 0 && (
            <div className="text-xs text-rose-400 mt-1">Passwords don’t match.</div>
          )}
        </Field>

        <Field label="I am a">
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
        </Field>

        <div className="flex gap-3">
          <Button type="submit" disabled={busy || usernameState !== "ok" || !pwMatch}>
            {busy ? "Creating…" : "Create account"}
          </Button>
          <Button href="/signin" variant="secondary">Already have an account?</Button>
        </div>
      </form>

      <div className="text-sm text-slate-400">
        Email verification is backlogged; we’ll add magic links later.
      </div>
    </div>
  );
}
