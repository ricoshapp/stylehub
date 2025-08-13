import { Building2, Scissors, CalendarClock, BadgeCheck, Percent, BadgeDollarSign, MapPin } from "lucide-react";

const H = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon size={14} className="shrink-0 text-slate-400" />
    <span>{label}</span>
  </div>
);

export default function ListHeader() {
  return (
    <div
      className="
        sticky top-[56px] z-20 grid
        grid-cols-[160px,1.6fr,1fr,1fr,1fr,1fr,1fr,1fr]
        items-center gap-3 px-3 py-2
        text-[11px] uppercase tracking-wide text-slate-400
        bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/50
        border border-slate-800 rounded-2xl shadow-sm
      "
    >
      <div />
      <H icon={Building2} label="Business" />
      <H icon={Scissors} label="Service" />
      <H icon={CalendarClock} label="Schedule / Employment" />
      <H icon={BadgeCheck} label="Experience" />
      <H icon={Percent} label="Compensation" />
      <H icon={BadgeDollarSign} label="Payment / Wage" />
      <H icon={MapPin} label="Location" />
    </div>
  );
}
