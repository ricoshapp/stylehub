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

const MapAddressModal = dynamic(() => import("./MapAddressModal"), {
  ssr: false,
});

const ROLES = [
  { value: "", label: "Any service" },
  { value: "barber", label: "Barber" },
  { value: "cosmetologist", label: "Cosmetologist" },
  { value: "esthetician", label: "Esthetician" },
  { value: "nail_tech", label: "Nail Tech" },
  { value: "lash_tech", label: "Lash Tech" },
  { value: "tattoo_artist", label: "Tattoo Artist" },
  { value: "piercer", label: "Piercer" },
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

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const [open, setOpen] = useState(true);
  const [showMap, setShowMap] = useState(false);

  const initial = useMemo<Q>(() => {
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
  const [cityTyping, setCityTyping] = useState<string>(initial.city ?? "");

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

  const setField = useCallback(<K extends keyof Q>(k: K, v: Q[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

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

  const onCityChange = (v: string) => {
    setCityTyping(v);
    setField("city", v);
  };

  const chips: Array<{ k: keyof Q; label: string }> = [];
  if (form.q) chips.push({ k: "q", label: `Search: ${form.q}` });
  if (form.role)
    chips.push({
      k: "role",
      label:
        ROLES.find((r) => r.value === form.role)?.label || form.role!,
    });
  if (form.sched)
    chips.push({
      k: "sched",
      label:
        SCHEDULES.find((s) => s.value === form.sched)?.label ||
        form.sched!,
    });
  if (form.comp)
    chips.push({
      k: "comp",
      label:
        COMP_MODELS.find((c) => c.value === form.comp)?.label ||
        form.comp!,
    });
  if (form.city) chips.push({ k: "city", label: `City: ${form.city}` });
  if (form.address) chips.push({ k: "address", label: `Near: ${form.address}` });
  if (form.lat && form.lng && form.radius)
    chips.push({ k: "radius", label: `Radius: ${form.radius} mi` });

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-zinc-950/80 backdrop-blur p-3 space-y-3">
        {/* Header (only toggle now) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-slate-200 hover:text-white"
            aria-expanded={open}
          >
            <Filter className={`h-5 w-5 ${open ? "" : "fill-current"}`} />
            <span className="text-sm font-medium">Filters</span>
          </button>
          {/* removed Clear all (we already have Reset below) */}
        </div>

        {/* Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setField(k, "")}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-zinc-800"
                title="Remove filter"
              >
                {label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        {open && (
          <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-8 gap-3">
            {/* Search */}
            <label className="lg:col-span-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-950 px-2 py-2">
              <Search className="h-4 w-4 shrink-0" />
              <input
                autoComplete="off"
                value={form.q ?? ""}
                onChange={(e) => setField("q", e.target.value)}
                placeholder="Search title or business"
                className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
              />
            </label>

            {/* Service */}
            <label className="lg:col-span-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-950 px-2 py-2">
              <Scissors className="h-4 w-4 shrink-0" />
              <select
                value={form.role ?? ""}
                onChange={(e) => setField("role", e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-100"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-zinc-900">
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Schedule */}
            <label className="lg:col-span-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-950 px-2 py-2">
              <Briefcase className="h-4 w-4 shrink-0" />
              <select
                value={form.sched ?? ""}
                onChange={(e) => setField("sched", e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-100"
              >
                {SCHEDULES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-zinc-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Compensation */}
            <label className="lg:col-span-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-950 px-2 py-2">
              <BadgeDollarSign className="h-4 w-4 shrink-0" />
              <select
                value={form.comp ?? ""}
                onChange={(e) => setField("comp", e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-100"
              >
                {COMP_MODELS.map((c) => (
                  <option key={c.value} value={c.value} className="bg-zinc-900">
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            {/* City (optional text) */}
            <label className="lg:col-span-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-950 px-2 py-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <input
                autoComplete="off"
                value={cityTyping}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="City (optional)"
                className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
              />
            </label>

            {/* Address + radius */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-950 px-2 py-2">
                <LocateFixed className="h-4 w-4 shrink-0" />
                <input
                  autoComplete="off"
                  value={form.address ?? ""}
                  onChange={(e) => setField("address", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setShowMap(true);
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
              </label>

              <div className="rounded-lg border border-slate-800 bg-zinc-950 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <Crosshair className="h-4 w-4" />
                    <span>Radius: {form.radius ?? "15"} mi</span>
                  </div>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-zinc-900"
                    title="Use my location"
                  >
                    Use my location
                  </button>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={Number(form.radius ?? "15")}
                  onChange={(e) => setField("radius", String(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {/* Hidden lat/lng */}
            <input type="hidden" value={form.lat ?? ""} readOnly />
            <input type="hidden" value={form.lng ?? ""} readOnly />

            {/* Actions */}
            <div className="lg:col-span-8 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-zinc-900"
              >
                <X className="h-4 w-4" />
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-emerald-500 text-black px-5 py-2 text-sm font-semibold hover:bg-emerald-400"
              >
                Apply
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Map Modal */}
      <MapAddressModal
        open={showMap}
        initial={{
          lat: form.lat ? Number(form.lat) : undefined,
          lng: form.lng ? Number(form.lng) : undefined,
          address: form.address || undefined,
        }}
        onClose={() => setShowMap(false)}
        onSelect={(o) => {
          const next: Q = {
            ...form,
            address: o.address,
            lat: String(o.lat),
            lng: String(o.lng),
            city: "", // keep radius cross-city
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
    </>
  );
}
