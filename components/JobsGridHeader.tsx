// components/JobsGridHeader.tsx
"use client";

import {
  Building2,
  Scissors,
  CalendarClock,
  BriefcaseBusiness,
  BadgeCheck,
  BadgeDollarSign,
  MapPin,
} from "lucide-react";

export default function JobsGridHeader() {
  return (
    <div className="sticky top-[68px] z-10 hidden md:grid job-grid rounded-2xl border border-slate-800 bg-zinc-950/70 px-4 py-2 backdrop-blur text-[12px] tracking-wide text-slate-400">
      <div /> {/* thumbnail spacer */}

      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-slate-300" />
        BUSINESS
      </div>

      <div className="flex items-center gap-2">
        <Scissors size={18} className="text-slate-300" />
        SERVICE
      </div>

      <div className="flex items-center gap-1.5">
        <CalendarClock size={18} className="text-slate-300" />
        <BriefcaseBusiness size={18} className="text-slate-300" />
        <span>SCHEDULE / EMPLOYMENT</span>
      </div>

      <div className="flex items-center gap-2">
        <BadgeCheck size={18} className="text-slate-300" />
        EXPERIENCE
      </div>

      <div className="flex items-center gap-2">
        <BadgeDollarSign size={18} className="text-slate-300" />
        COMPENSATION
      </div>

      <div className="flex items-center gap-2">
        <BadgeDollarSign size={18} className="text-slate-300" />
        PAYMENT / WAGE
      </div>

      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-slate-300" />
        LOCATION
      </div>
    </div>
  );
}
