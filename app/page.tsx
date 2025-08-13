// app/page.tsx
import CTAButton from "@/components/CTAButton";
import Link from "next/link";
import { Scissors, BadgeDollarSign, MapPin, MessageSquareText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-3xl border border-slate-800 bg-zinc-950/50 p-8 md:p-12">
        <div className="flex flex-col items-start gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              StyleHub
            </h1>
            <p className="mt-2 text-lg md:text-xl text-slate-300">
              Connecting local talent & shops — fast.
            </p>
          </div>

          {/* Only Sign up / Sign in */}
          <div className="flex flex-wrap gap-3">
            <CTAButton href="/signup">Sign up</CTAButton>
            <CTAButton href="/signin" variant="secondary">Sign in</CTAButton>
          </div>

          <div className="flex flex-wrap gap-4 text-slate-300 pt-2">
            <Feature icon={<Scissors className="h-4 w-4" />} label="Trade-specific filters" />
            <Feature icon={<BadgeDollarSign className="h-4 w-4" />} label="Booth, commission, hourly, hybrid" />
            <Feature icon={<MapPin className="h-4 w-4" />} label="Local-first with map & radius" />
            <Feature icon={<MessageSquareText className="h-4 w-4" />} label="Quick DMs & alerts" />
          </div>
        </div>
      </section>

      {/* Quick links grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile title="Browse Jobs" href="/jobs" desc="Filter by service, pay model, schedule." />
        <Tile title="Post a Job" href="/post" desc="3-minute posting flow for shops." />
        <Tile title="Inbox" href="/inbox" desc="See inquiries and replies." />
        <Tile title="Profile" href="/profile" desc="Edit your info & role." />
      </section>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-black/30 px-3 py-1 text-sm">
      {icon}
      <span>{label}</span>
    </span>
  );
}

function Tile({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-zinc-950/50 p-5 hover:bg-zinc-900/50 transition"
    >
      <div className="text-base font-semibold group-hover:underline">{title}</div>
      <div className="mt-1 text-sm text-slate-300">{desc}</div>
    </Link>
  );
}
