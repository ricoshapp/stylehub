"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Filter,
  X,
  MapPin,
  Store,
  Scissors,
  BadgeDollarSign,
  Search,
  Crosshair,
  Briefcase,
} from "lucide-react";
import dynamic from "next/dynamic";

const MapAddressModal = dynamic(() => import("./MapAddressModal"), { ssr: false });

type Q = {
  q?: string;
  role?: string;
  comp?: string;
  sched?: string;
  city?: string;
  address?: string;
  radius?: string;
  lat?: string;
  lng?: string;
};

const ROLES = [
  { value: "", label: "Any service" },
  { value: "barber", label: "Barber" },
  { value: "cosmetologist", label: "Cosmetologist" },
  { value: "tattoo_artist", label: "Tattoo Artist" },
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

type K = keyof Q;

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const firstLoadAutoLocated = useRef(false);

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
    } as Q;
  }, [sp]);

  const [form, setForm] = useState<Q>(initial);
  const [cityTyping, setCityTyping] = useState(initial.city ?? "");

  useEffect(() => {
    const hasAny = ["q", "role", "comp", "sched", "city", "address", "radius", "lat", "lng"].some(
      (k) => Boolean(sp.get(k))
    );
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

  const setField = useCallback((k: K, v: Q[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const copy: Q = { ...form };
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
  }, []);

  useEffect(() => {
    if (firstLoadAutoLocated.current) return;
    const none = !form.q && !form.role && !form.comp && !form.sched && !form.city && !form.address && !form.lat && !form.lng;
    if (!none) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        firstLoadAutoLocated.current = true;
        const { latitude, longitude } = pos.coords;

        let address = "Current location";
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url, { headers: { "Accept-Language": "en" } });
          if (res.ok) {
            const data = await res.json();
            const a = data.address || {};
            const road = a.road || a.pedestrian || a.path || "";
            const hn = a.house_number ? `${a.house_number} ` : "";
            if (road) address = `${hn}${road}`;
          }
        } catch {}

        const next: Q = {
          ...form,
          lat: String(latitude),
          lng: String(longitude),
          address,
          city: "",
        };
        setForm(next);

        const params = new URLSearchParams();
        (Object.keys(next) as (keyof Q)[]).forEach((k) => {
          const val = (next[k] ?? "").toString().trim();
          if (val) params.set(k, val);
        });
        router.push(`/jobs?${params.toString()}`);
      },
      () => {},
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCityChange = (v: string) => {
    setCityTyping(v);
    setField("city", v);
  };

  const chips: Array<{ k: keyof Q; label: string }> = [];
  if (form.q) chips.push({ k: "q", label: `Search: ${form.q}` });
  if (form.role) chips.push({ k: "role", label: ROLES.find((r) => r.value === form.role)?.label || form.role! });
  if (form.sched) chips.push({ k: "sched", label: SCHEDULES.find((s) => s.value === form.sched)?.label || form.sched! });
  if (form.comp) chips.push({ k: "comp", label: COMP_MODELS.find((c) => c.value === form.comp)?.label || form.comp! });
  if (form.city) chips.push({ k: "city", label: `City: ${form.city}` });
  if (form.address) chips.push({ k: "address", label: `Near: ${form.address}` });
  if (form.lat && form.lng && form.radius) chips.push({ k: "radius", label: `Radius: ${form.radius} mi` });

  const onRadiusChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setField("radius", String(e.target.value));
  };
  const onRadiusCommit = () => submit();

  return (
    <>
      <div className="flex items-center justify-between py-2">
        {/* Unified style for open/close button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-zinc-900 px-3 py-1.5 text-sm text-slate-100 hover:bg-zinc-800"
          aria-expanded={open}
          title={open ? "Hide filters" : "Show filters"}
        >
          {open ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          Filters
        </button>

        {chips.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-2">
            {chips.map(({ k, label }) => (
              <button
                key={`${k}:${label}`}
                onClick={() => setField(k, "")}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-zinc-800"
                title="Remove filter"
              >
                {label} <X className="h-3 w-3 opacity-70" />
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="rounded-xl border border-slate-800 bg-black/30 p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
              <Search className="h-4 w-4 opacity-80 shrink-0" />
              <input
                value={form.q || ""}
                onChange={(e) => setField("q", e.target.value)}
                placeholder="Search title or business"
                className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
              <Store className="h-4 w-4 opacity-80 shrink-0" />
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

            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
              <Briefcase className="h-4 w-4 opacity-80 shrink-0" />
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

            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
              <BadgeDollarSign className="h-4 w-4 opacity-80 shrink-0" />
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

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_260px] gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
              <Scissors className="h-4 w-4 opacity-80 shrink-0" />
              <input
                value={cityTyping}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="City (optional)"
                className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
              <MapPin className="h-4 w-4 opacity-80 shrink-0" />
              <input
                value={form.address || ""}
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
              <button
                type="button"
                onClick={async () => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    async ({ coords }) => {
                      const { latitude, longitude } = coords;
                      setForm((f) => ({
                        ...f,
                        lat: String(latitude),
                        lng: String(longitude),
                        city: "",
                        address: "Current location",
                      }));
                      submit();
                    },
                    () => {},
                    { timeout: 8000 }
                  );
                }}
                className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-zinc-800 text-slate-100 hover:bg-zinc-700"
                title="Use my location"
              >
                <Crosshair className="h-3 w-3" /> Use my location
              </button>
            </div>

            <div className="rounded-lg bg-zinc-900 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Radius</span>
                <span className="font-medium">{form.radius ?? "15"} mi</span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={5}
                value={Number(form.radius ?? 15)}
                onChange={onRadiusChange}
                onMouseUp={onRadiusCommit}
                onTouchEnd={onRadiusCommit}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
              title="Reset filters"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-md bg-green-500 text-black px-3 py-1.5 text-sm font-semibold hover:bg-green-400"
              title="Apply filters"
            >
              Apply
            </button>
          </div>
        </form>
      )}

      {showMap && (
        <MapAddressModal
          initialAddress={form.address || ""}
          onClose={() => setShowMap(false)}
          onSelect={(o) => {
            const next: Q = {
              ...form,
              address: o.address,
              lat: String(o.lat),
              lng: String(o.lng),
              city: "",
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
