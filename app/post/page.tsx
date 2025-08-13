// app/post/page.tsx
"use client";

import { useEffect, useState } from "react";
import MapPicker from "@/components/MapPicker";

type Loc = {
  lat: number;
  lng: number;
  addressLine1?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

const SD: Loc = { lat: 32.7157, lng: -117.1611, city: "San Diego", state: "CA", county: "San Diego County", country: "US" };

export default function PostJobPage() {
  // required to avoid Prisma error
  const [businessName, setBusinessName] = useState("");
  const [title, setTitle] = useState("");

  // core fields (same as before)
  const [role, setRole] = useState<"barber"|"cosmetologist"|"esthetician"|"nail_tech"|"lash_tech"|"tattoo_artist"|"piercer">("barber");
  const [compModel, setCompModel] = useState<"booth_rent"|"commission"|"hourly"|"hybrid">("hourly");
  const [payMin, setPayMin] = useState<number | null>(null);
  const [payMax, setPayMax] = useState<number | null>(null);
  const [payUnit, setPayUnit] = useState<"$/hr"|"$/wk"|"%">("$/hr");
  const [payVisible, setPayVisible] = useState(true);
  const [employmentType, setEmploymentType] = useState<""|"employee"|"c1099"|"any">("");
  const [schedule, setSchedule] = useState<""|"full_time"|"part_time"|"any">("");
  const [experienceText, setExperienceText] = useState("");
  const [description, setDescription] = useState("");

  // location
  const [loc, setLoc] = useState<Loc>(SD);
  const [addressQuery, setAddressQuery] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (compModel === "commission") setPayUnit("%");
    else if (compModel === "booth_rent") setPayUnit("${/wk}" as any) || setPayUnit("$/wk");
    else if (compModel === "hourly") setPayUnit("$/hr");
    else setPayUnit("$/hr"); // hybrid (wage unit)
  }, [compModel]);

  function onlyInt(v: string): number | null {
    if (v === "") return null;
    const n = Math.max(0, Math.floor(Number(v.replace(/\D+/g, ""))));
    return Number.isFinite(n) ? n : null;
  }

  async function geocodeAddress(q: string) {
    const query = `${q}, San Diego County, CA`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&bounded=1&viewbox=-117.7,33.5,-116.0,32.5`,
      { headers: { "Accept-Language": "en", "User-Agent": "stylehub-local-dev" as any }, cache: "no-store" }
    );
    const arr = await res.json();
    const hit = arr?.[0];
    if (!hit) return;
    const rev = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${hit.lat}&lon=${hit.lon}`,
      { headers: { "Accept-Language": "en", "User-Agent": "stylehub-local-dev" as any }, cache: "no-store" }
    );
    const data = await rev.json();
    const a = data?.address || {};
    setLoc({
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      addressLine1: data?.name || null,
      city: a.city || a.town || a.village || a.hamlet || null,
      county: a.county || "San Diego County",
      state: a.state || "CA",
      postalCode: a.postcode || null,
      country: a.country_code ? String(a.country_code).toUpperCase() : "US",
    });
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      if (!businessName.trim()) throw new Error("Business name is required.");
      if (!title.trim()) throw new Error("Short title is required.");

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          businessName: businessName.trim(),
          title: title.trim(),
          role,
          compModel,
          payMin,
          payMax,
          payUnit,
          payVisible,
          employmentType: employmentType || null,
          schedule: schedule || null,
          experienceText: experienceText.trim() || null,
          shiftDays: [false, false, false, false, false, false, false],
          apprenticeFriendly: false,
          perks: [],
          description: description.slice(0, 200),
          location: {
            lat: loc.lat,
            lng: loc.lng,
            addressLine1: loc.addressLine1 ?? null,
            city: loc.city ?? null,
            county: loc.county ?? "San Diego County",
            state: loc.state ?? "CA",
            postalCode: loc.postalCode ?? null,
            country: loc.country ?? "US",
          },
          photos: [], // placeholder; upload later
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "Failed to create job");
      window.location.href = `/jobs/${data.job.id}`;
    } catch (e: any) {
      setMsg(e.message || "Failed to create job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Post a Job</h1>
      {msg && <div className="rounded-xl border border-slate-800 bg-zinc-950/70 p-3 text-slate-100">{msg}</div>}

      {/* Basics */}
      <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Business name *</div>
            <input
              className="input w-full"
              placeholder="American Deluxe"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={60}
              required
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Short title *</div>
            <input
              className="input w-full"
              placeholder="Chair available — walk-ins welcome"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              maxLength={120}
              required
            />
          </label>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Service</div>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="barber">Barber</option>
              <option value="cosmetologist">Cosmetologist</option>
              <option value="esthetician">Esthetician</option>
              <option value="nail_tech">Nail Tech</option>
              <option value="lash_tech">Lash Tech</option>
              <option value="tattoo_artist">Tattoo Artist</option>
              <option value="piercer">Piercer</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Compensation</div>
            <select className="input" value={compModel} onChange={(e) => setCompModel(e.target.value as any)}>
              <option value="hourly">Hourly</option>
              <option value="commission">Commission</option>
              <option value="booth_rent">Booth Rent</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Show pay publicly</div>
            <select className="input" value={payVisible ? "yes" : "no"} onChange={(e) => setPayVisible(e.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No (Hidden)</option>
            </select>
          </label>
        </div>

        {/* Pay */}
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">
              {compModel === "commission" || compModel === "hybrid" ? "Commission (shop %)" :
               compModel === "booth_rent" ? "Rent" : "Wage"}
            </div>
            <input
              className="input"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 25"
              value={payMin ?? ""}
              onChange={(e) => setPayMin(onlyInt(e.target.value))}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Unit</div>
            <select className="input" value={payUnit} onChange={(e) => setPayUnit(e.target.value as any)} disabled={compModel === "commission"}>
              {compModel === "commission" ? (
                <option value="%">%</option>
              ) : compModel === "booth_rent" ? (
                <>
                  <option value="$/wk">$/wk</option>
                  <option value="$/hr">$/hr</option>
                </>
              ) : compModel === "hourly" ? (
                <option value="$/hr">$/hr</option>
              ) : (
                <>
                  <option value="%">%</option>
                  <option value="$/hr">$/hr</option>
                </>
              )}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">
              {compModel === "hybrid" ? "Wage" : compModel === "booth_rent" ? "—" : "Max (optional)"}
            </div>
            <input
              className="input"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={compModel === "hybrid" ? "e.g. 25" : ""}
              value={payMax ?? ""}
              onChange={(e) => setPayMax(onlyInt(e.target.value))}
              disabled={compModel === "booth_rent"}
            />
          </label>
        </div>

        {/* Employment / schedule / experience */}
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Employment</div>
            <select className="input" value={employmentType} onChange={(e) => setEmploymentType(e.target.value as any)}>
              <option value="">—</option>
              <option value="employee">Employee</option>
              <option value="c1099">Independent Contractor</option>
              <option value="any">Any</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Schedule</div>
            <select className="input" value={schedule} onChange={(e) => setSchedule(e.target.value as any)}>
              <option value="">—</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="any">Any</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Experience (optional)</div>
            <input
              className="input"
              placeholder="e.g. Y2 (2 yrs), Any"
              maxLength={20}
              value={experienceText}
              onChange={(e) => setExperienceText(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Address (optional)</div>
            <input
              className="input"
              placeholder="123 Main St"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (addressQuery.trim()) await geocodeAddress(addressQuery.trim());
                }
              }}
            />
            <div className="text-xs text-slate-500 mt-1">Press Enter to search & center the map.</div>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">City</div>
            <input
              className="input"
              value={loc.city ?? ""}
              onChange={(e) => setLoc({ ...loc, city: e.target.value })}
              placeholder="San Diego"
            />
          </label>
        </div>

        <MapPicker value={loc} onChange={setLoc} />

        <div className="grid md:grid-cols-4 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">County (locked)</div>
            <input className="input" value={loc.county ?? "San Diego County"} disabled />
          </label>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">State (locked)</div>
            <input className="input" value={loc.state ?? "CA"} disabled />
          </label>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Postal code</div>
            <input
              className="input"
              inputMode="numeric"
              pattern="[0-9]*"
              value={loc.postalCode ?? ""}
              onChange={(e) => setLoc({ ...loc, postalCode: e.target.value.replace(/\D+/g, "").slice(0, 10) })}
              placeholder="92101"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Lat, Lng</div>
            <input className="input" value={`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`} readOnly />
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-slate-800 bg-zinc-950/60 p-5 space-y-4">
        <label className="block">
          <div className="mb-1 text-sm text-slate-300">Description (max 200)</div>
          <textarea
            className="input h-32 resize-none"
            maxLength={200}
            placeholder="Tools provided, clientele, expectations, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
          />
          <div className="text-xs text-slate-500 mt-1">{description.length}/200</div>
        </label>
      </div>

      <div className="flex gap-3">
        <button className="btn" onClick={submit} disabled={busy}>{busy ? "Publishing…" : "Publish Job"}</button>
        <button className="btn-secondary" onClick={() => window.location.reload()} disabled={busy}>Reset</button>
      </div>
    </div>
  );
}
