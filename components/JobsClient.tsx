// components/JobsClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FilterBar, { type Filters } from "@/components/FilterBar";
import JobCard from "@/components/JobCard";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Image as ImageIcon,
  Building2,
  Scissors,
  CalendarClock,
  Sparkles,
  BadgeDollarSign,
  MapPin,
} from "lucide-react";

/* Haversine miles */
function distMiles(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const la1 = toRad(aLat);
  const la2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
const parseBool = (v: any) => v === true || v === "true" || v === "1";

export default function JobsClient({ jobs }: { jobs: any[] }) {
  const sp = useSearchParams();
  const router = useRouter();

  const init: Filters = {
    county: "San Diego County",
    role: (sp.get("role") || undefined) as any,
    schedule: (sp.get("schedule") || undefined) as any,
    employmentType: (sp.get("employmentType") || undefined) as any,
    compModel: (sp.get("compModel") || undefined) as any,
    apprenticeFriendly: parseBool(sp.get("apprenticeFriendly")),
    posted: (sp.get("posted") || undefined) as any,
    address: sp.get("address") || undefined,
    lat: sp.get("lat") ? parseFloat(sp.get("lat") as string) : undefined,
    lng: sp.get("lng") ? parseFloat(sp.get("lng") as string) : undefined,
    radius: sp.get("radius") ? parseInt(sp.get("radius") as string, 10) : 15,
  };
  const [filters, setFilters] = useState<Filters>(init);

  // Sync URL for share/refresh
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.role) params.set("role", filters.role);
    if (filters.schedule) params.set("schedule", filters.schedule);
    if (filters.employmentType) params.set("employmentType", filters.employmentType);
    if (filters.compModel) params.set("compModel", filters.compModel);
    if (filters.apprenticeFriendly) params.set("apprenticeFriendly", "true");
    if (filters.posted) params.set("posted", filters.posted);
    if (filters.address) params.set("address", filters.address);
    if (filters.lat != null && filters.lng != null) {
      params.set("lat", String(filters.lat));
      params.set("lng", String(filters.lng));
    }
    if (filters.radius != null) params.set("radius", String(filters.radius));
    router.replace(params.toString() ? `/jobs?${params.toString()}` : "/jobs");
  }, [filters, router]);

  const withinPosted = useCallback((dt: string | Date, window: Filters["posted"]) => {
    if (!window) return true;
    const when = typeof dt === "string" ? new Date(dt) : dt;
    const days = window === "24h" ? 1 : window === "7d" ? 7 : 30;
    return Date.now() - when.getTime() <= days * 24 * 3600 * 1000;
  }, []);

  const filtered = useMemo(() => {
    const lat = filters.lat;
    const lng = filters.lng;
    const radius = filters.radius ?? 15;
    const limitDistance = Number.isFinite(lat) && Number.isFinite(lng) && radius < 45;

    return jobs.filter((j) => {
      if (filters.role && j.role !== filters.role) return false;
      if (filters.schedule && j.schedule !== filters.schedule) return false;
      if (filters.employmentType && j.employmentType !== filters.employmentType) return false;
      if (filters.compModel && j.compModel !== filters.compModel) return false;
      if (filters.apprenticeFriendly && !j.apprenticeFriendly) return false;
      if (!withinPosted(j.createdAt, filters.posted)) return false;
      if (limitDistance) {
        const jl = j.location ?? {};
        if (!Number.isFinite(jl.lat) || !Number.isFinite(jl.lng)) return false;
        if (distMiles(lat!, lng!, jl.lat, jl.lng) > radius) return false;
      }
      return true;
    });
  }, [jobs, filters, withinPosted]);

  return (
    <div className="space-y-4">
      <FilterBar value={filters} onChange={setFilters} />

      {/* Column header (tablet/desktop). Matches JobCard grid exactly. */}
      <div className="hidden md:grid grid-cols-[150px_1.4fr_1fr_1.2fr_1fr_1fr_1.2fr_1fr] gap-3 px-3">
        <div className="pl-1 flex items-center gap-2 text-slate-200 text-sm font-medium">
          <ImageIcon size={16} aria-hidden />
          <span>Photo</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <Building2 size={16} aria-hidden />
          <span>Business</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <Scissors size={16} aria-hidden />
          <span>Service</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <CalendarClock size={16} aria-hidden />
          <span>Schedule / Employment</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <Sparkles size={16} aria-hidden />
          <span>Experience</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <BadgeDollarSign size={16} aria-hidden />
          <span>Compensation</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <BadgeDollarSign size={16} aria-hidden />
          <span>Payment / Wage</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <MapPin size={16} aria-hidden />
          <span>Location</span>
        </div>
      </div>

      {/* Stacked banner rows */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
        {filtered.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-zinc-950/50 p-6 text-slate-300">
          No results with current filters. Try setting your location and widening the radius.
        </div>
      )}
    </div>
  );
}
