// components/FilterBar.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, LocateFixed, SlidersHorizontal, X } from "lucide-react";

export type Filters = {
  county?: string;
  role?: string;
  schedule?: "" | "full_time" | "part_time";
  employmentType?: "" | "w2" | "c1099";
  compModel?: "" | "hourly" | "commission" | "booth_rent" | "hybrid";
  apprenticeFriendly?: boolean;
  posted?: "" | "24h" | "7d" | "30d";
  address?: string;
  lat?: number;
  lng?: number;
  radius?: number; // miles; >=45 => "40+"
};

export default function FilterBar({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
}) {
  const [open, setOpen] = useState(true);
  const [addr, setAddr] = useState(value.address ?? "");
  useEffect(() => setAddr(value.address ?? ""), [value.address]);

  const radius = value.radius ?? 15;
  const radiusLabel = radius >= 45 ? "40+ mi" : `${radius} mi`;
  const hasLatLng = Number.isFinite(value.lat) && Number.isFinite(value.lng);

  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  const geocodeAddressCA = useCallback(async (q: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=us&q=${encodeURIComponent(
      `${q}, CA`
    )}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = (await res.json()) as any[];
    const d = data?.[0];
    if (!d) return null;
    return { lat: parseFloat(d.lat), lng: parseFloat(d.lon), formatted: d.display_name as string };
  }, []);

  async function setAddress() {
    const q = addr.trim();
    if (!q) {
      set({ address: "", lat: undefined, lng: undefined });
      return;
    }
    const hit = await geocodeAddressCA(q);
    if (!hit) return;
    set({ address: q, lat: hit.lat, lng: hit.lng });
  }

  async function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => set({ address: "Current location", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  function clearLocation() {
    setAddr("");
    set({ address: "", lat: undefined, lng: undefined });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-zinc-950/50">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-slate-200">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-zinc-900"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div className="grid gap-3 p-3 md:grid-cols-3">
          {/* County (locked) */}
          <div>
            <div className="text-xs text-slate-400 mb-1">County</div>
            <input className="input" value="San Diego County" readOnly />
          </div>

          {/* Address + Me (no Set button; press Enter to apply) */}
          <div className="md:col-span-2">
            <div className="text-xs text-slate-400 mb-1">Address (press Enter to apply)</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="input pl-8"
                  placeholder="e.g., 123 Main St, Oceanside"
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setAddress();
                    }
                  }}
                />
                {addr && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    onClick={clearLocation}
                    aria-label="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-zinc-900"
                onClick={useMyLocation}
                title="Use my location"
              >
                <LocateFixed size={16} />
                Me
              </button>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {hasLatLng ? (
                <>Distance is measured from <span className="text-slate-200">{value.address || "your location"}</span>.</>
              ) : (
                <>Tip: press <b>Enter</b> after typing an address, or click <b>Me</b>.</>
              )}
            </div>
          </div>

          {/* Service */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Service</div>
            <select
              className="input"
              value={value.role ?? ""}
              onChange={(e) => set({ role: (e.target.value || undefined) as any })}
            >
              <option value="">Any</option>
              <option value="barber">Barber</option>
              <option value="cosmetologist">Cosmetologist</option>
              <option value="esthetician">Esthetician</option>
              <option value="nail_tech">Nail Tech</option>
              <option value="lash_tech">Lash Tech</option>
              <option value="tattoo_artist">Tattoo Artist</option>
              <option value="piercer">Piercer</option>
            </select>
          </div>

          {/* Schedule */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Schedule</div>
            <select
              className="input"
              value={value.schedule ?? ""}
              onChange={(e) => set({ schedule: (e.target.value || "") as any })}
            >
              <option value="">Any</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
            </select>
          </div>

          {/* Employment */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Employment</div>
            <select
              className="input"
              value={value.employmentType ?? ""}
              onChange={(e) => set({ employmentType: (e.target.value || "") as any })}
            >
              <option value="">Any</option>
              <option value="w2">Employee</option>
              <option value="c1099">Independent Contractor</option>
            </select>
          </div>

          {/* Comp model */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Compensation Model</div>
            <select
              className="input"
              value={value.compModel ?? ""}
              onChange={(e) => set({ compModel: (e.target.value || "") as any })}
            >
              <option value="">Any</option>
              <option value="booth_rent">Booth Rent</option>
              <option value="commission">Commission</option>
              <option value="hourly">Hourly</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Posted */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Posted</div>
            <select
              className="input"
              value={value.posted ?? ""}
              onChange={(e) => set({ posted: (e.target.value || "") as any })}
            >
              <option value="">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          {/* Radius (always enabled) */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400 mb-1">Radius</div>
              <div className="text-xs text-slate-300">{radiusLabel}</div>
            </div>
            <input
              type="range"
              min={5}
              max={45}
              step={5}
              className="w-full"
              value={radius}
              onChange={(e) => set({ radius: parseInt(e.target.value, 10) })}
            />
            {!hasLatLng && (
              <div className="mt-1 text-[11px] text-slate-500">
                Set an address (press Enter) or click <b>Me</b> to apply the radius.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
