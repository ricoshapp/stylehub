// components/FilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Filter,
  X,
  MapPin,
  Briefcase,
  Scissors,
  BadgeDollarSign,
  Search,
  Crosshair,
  LocateFixed,
} from "lucide-react";
import dynamic from "next/dynamic";
import CTAButton from "@/components/CTAButton";

// Keep your dynamic import + behavior
const MapAddressModal = dynamic(() => import("./MapAddressModal"), {
  ssr: false,
});

// ===== Static options (unchanged for comp/schedule). Service limited as requested =====
const ROLES = [
  { value: "", label: "Any service" },
  { value: "barber", label: "Barber" },
  { value: "cosmetologist", label: "Cosmetologist" },
  { value: "tattoo_artist", label: "Tattoo Artist" },
  // removed: esthetician, nail_tech, lash_tech, piercer (per request)
];

const COMP_MODELS = [
  { value: "", label: "Any compensation" },
  { value: "hourly", label: "Hourly" },
  { value: "commission", label: "Commission" },
  { value: "booth_rent", label: "Booth Rent" },
  { value: "hybrid", label: "Hybrid" },
];

const SCHEDULES = [
  { value: "", label: "Any schedule" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "any", label: "Any" },
];

type Q = {
  q?: string;
  role?: string;
  comp?: string;
  sched?: string;
  city?: string; // optional; ignored if lat/lng present
  address?: string;
  radius?: string; // miles
  lat?: string;
  lng?: string;
};

// keep radius behavior the same (5-40, default 15)
function clampRadius(v: number) {
  if (Number.isNaN(v)) return 15;
  if (v < 5) return 5;
  if (v > 40) return 40;
  return Math.round(v);
}

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const [open, setOpen] = useState(true);
  const [showMap, setShowMap] = useState(false);

  // ===== Read initial state from URL or localStorage (unchanged behavior) =====
  const initial = useMemo(() => {
    const get = (k: string) => sp.get(k) ?? "";
    return {
      q: get("q"),
      role: get("role"),
      comp: get("comp"),
      sched: get("sched"),
      city: get("city"),
      address: get("address"),
      radius: get("radius") || "15",
      lat: get("lat") || "",
      lng: get("lng") || "",
    };
  }, [sp]);

  const [form, setForm] = useState<Q>(initial);
  const [cityTyping, setCityTyping] = useState(initial.city ?? "");

  useEffect(() => {
    const hasAny = [
      "q",
      "role",
      "comp",
      "sched",
      "city",
      "address",
      "radius",
      "lat",
      "lng",
    ].some((k) => Boolean(sp.get(k)));

    if (!hasAny) {
      const saved = localStorage.getItem("jobsFilters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Q;
          setForm((f) => ({ ...f, ...parsed }));
          setCityTyping(parsed.city ?? "");
        } catch {}
      }
    } else {
      setForm(initial);
      setCityTyping(initial.city ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("jobsFilters", JSON.stringify(form));
  }, [form]);

  type K = keyof Q;
  const setField = useCallback((k: K, v: Q[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  // ===== Apply / Reset (same logic) =====
  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const copy: Q = { ...form };

      // If precise lat/lng present, ignore city to allow cross-city radius
      if (copy.lat && copy.lng) copy.city = "";

      const params = new URLSearchParams();
      (Object.keys(copy) as (keyof Q)[]).forEach((k) => {
        const val = (copy[k] ?? "").toString().trim();
        if (val) params.set(k, val);
      });

      router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [form, router]
  );

  const clearAll = useCallback(() => {
    setForm({
      q: "",
      role: "",
      comp: "",
      sched: "",
      city: "",
      address: "",
      radius: "15",
      lat: "",
      lng: "",
    });
    setCityTyping("");
    router.push("/jobs");
  }, [router]);

  // ===== Geolocate (unchanged) =====
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((f) => ({
          ...f,
          lat: String(latitude),
          lng: String(longitude),
          city: "",
          address: "Current location",
        }));
        setCityTyping("");
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  // ===== City typing (unchanged) =====
  const onCityChange = (v: string) => {
    setCityTyping(v);
    setField("city", v);
  };

  // ===== Filter chips (unchanged) =====
  const chips: Array<{ k: keyof Q; label: string }> = [];
  if (form.q) chips.push({ k: "q", label: `Search: ${form.q}` });
  if (form.role)
    chips.push({
      k: "role",
      label: ROLES.find((r) => r.value === form.role)?.label || form.role!,
    });
  if (form.sched)
    chips.push({
      k: "sched",
      label: SCHEDULES.find((s) => s.value === form.sched)?.label || form.sched!,
    });
  if (form.comp)
    chips.push({
      k: "comp",
      label:
        COMP_MODELS.find((c) => c.value === form.comp)?.label || form.comp!,
    });
  if (form.city) chips.push({ k: "city", label: `City: ${form.city}` });
  if (form.address) chips.push({ k: "address", label: `Near: ${form.address}` });
  if (form.lat && form.lng && form.radius)
    chips.push({ k: "radius", label: `Radius: ${form.radius} mi` });

  return (
    <>
      {/* Header row: toggle + actions (Apply/Reset moved up & flush) */}
      <div className="mb-2 flex items-start justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-slate-200 hover:text-white"
          aria-expanded={open}
        >
          <Filter size={16} />
          <span>Filters</span>
        </button>

        <div className="flex items-start gap-2">
          <CTAButton
            onClick={submit}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Apply
          </CTAButton>
          <button
            onClick={clearAll}
            className="rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            title="Reset all filters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Active filter chips (unchanged) */}
      {chips.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {chips.map(({ k, label }) => (
            <button
              key={k as string}
              onClick={() => setField(k, "")}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-zinc-800"
              title="Remove filter"
            >
              {label}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Body — full filter panel (unchanged behaviors) */}
      {open && (
        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-800 bg-black/30 p-3 sm:p-4"
        >
          {/* Row 1: Search / Service / Schedule / Compensation */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                value={form.q || ""}
                onChange={(e) => setField("q", e.target.value)}
                placeholder="Search title or business"
                className="w-full rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Service (limited to requested options) */}
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <Scissors size={14} className="text-slate-400" />
              <select
                value={form.role || ""}
                onChange={(e) => setField("role", e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-100"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <Briefcase size={14} className="text-slate-400" />
              <select
                value={form.sched || ""}
                onChange={(e) => setField("sched", e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-100"
              >
                {SCHEDULES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Compensation */}
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <BadgeDollarSign size={14} className="text-slate-400" />
              <select
                value={form.comp || ""}
                onChange={(e) => setField("comp", e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-100"
              >
                {COMP_MODELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: City / Address + (Set) / Radius + Use my location */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* City */}
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <MapPin size={14} className="text-slate-400" />
              <input
                value={cityTyping}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="City (optional)"
                className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Address + Set (Map) */}
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <LocateFixed size={14} className="text-slate-400" />
              <input
                value={form.address || ""}
                onChange={(e) => setField("address", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setShowMap(true); // open modal on Enter for precise pick
                  }
                }}
                placeholder="Address (Enter or Set to pick on map)"
                className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="text-xs px-2 py-1 rounded bg-white text-black hover:bg-slate-100"
                title="Open map"
              >
                Set
              </button>
            </div>

            {/* Radius + Use my location */}
            <div className="rounded-md border border-slate-800 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>
                  Radius: <strong>{form.radius ?? "15"}</strong> mi
                </span>
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                  title="Use my location"
                >
                  <Crosshair size={12} />
                  Use my location
                </button>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={1}
                value={clampRadius(parseInt(form.radius || "15", 10))}
                onChange={(e) =>
                  setField("radius", String(clampRadius(parseInt(e.target.value, 10))))
                }
                className="w-full mt-2"
              />
            </div>
          </div>

          {/* Hidden lat/lng (state only; URL set on submit) */}
          {/* kept intentionally invisible */}
        </form>
      )}

      {/* Map modal stays the same pattern as your previous code */}
      {showMap && (
        <MapAddressModal
          open={showMap}
          onClose={() => setShowMap(false)}
          onSelect={(o: { lat: number; lng: number; address: string }) => {
            const next: Q = {
              ...form,
              address: o.address,
              lat: String(o.lat),
              lng: String(o.lng),
              city: "", // allow cross-city radius searches
            };
            setForm(next);
            const params = new URLSearchParams();
            (Object.keys(next) as (keyof Q)[]).forEach((k) => {
              const val = (next[k] ?? "").toString().trim();
              if (val) params.set(k, val);
            });
            router.push(`/jobs?${params.toString()}`);
          }}
        />
      )}
    </>
  );
}
