// app/post/page.tsx
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import CTAButton from "@/components/CTAButton";
import FormField from "@/components/FormField";
import MapPicker, { PickedLocation } from "@/components/MapPicker";
import { useRouter } from "next/navigation";

type CompModel = "hourly" | "commission" | "booth_rent" | "hybrid";
type RoleLite = "barber" | "cosmetologist" | "tattoo_artist";

const ROLE_OPTIONS: { value: RoleLite; label: string }[] = [
  { value: "barber", label: "Barber" },
  { value: "cosmetologist", label: "Cosmetologist" },
  { value: "tattoo_artist", label: "Tattoo Artist" },
];

const RENT_UNITS = ["$/d", "$/wk", "$/m"] as const;

export default function PostPage() {
  const router = useRouter();

  // Core job fields
  const [businessName, setBusinessName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<RoleLite>("barber");
  const [compModel, setCompModel] = useState<CompModel>("hourly");

  // Compensation
  const [unit, setUnit] = useState<string>("$/hr");
  // For different models, we’ll map to payload later:
  // hourly  => wage -> payMin, payUnit $/hr
  // commission => commissionPct -> payMin, payUnit '%'
  // booth_rent => rent -> payMin, payUnit ($/d|$/wk|$/m)
  // hybrid => commissionPct -> payMin, wageHourly -> payMax, payUnit $/hr
  const [commissionPct, setCommissionPct] = useState<string>(""); // int
  const [wageHourly, setWageHourly] = useState<string>(""); // int
  const [rent, setRent] = useState<string>(""); // int

  // Schedule/employment/experience (kept simple)
  const [schedule, setSchedule] = useState<"" | "full_time" | "part_time" | "any">("any");
  const [employmentType, setEmploymentType] = useState<"" | "w2" | "c1099">("");
  const [experienceText, setExperienceText] = useState("");

  const [description, setDescription] = useState("");
  const [payVisible, setPayVisible] = useState(true);

  // Location
  const [addressInput, setAddressInput] = useState(""); // text field user types
  const [picked, setPicked] = useState<PickedLocation | null>(null);

  // Image upload (thumbnail)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // MapPicker will geocode when addressInput changes and user presses Enter
  const [addressSearchKey, setAddressSearchKey] = useState<string>("");

  function onAddressKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      setAddressSearchKey(addressInput.trim());
    }
  }

  const lockUnit = useMemo(() => {
    switch (compModel) {
      case "hourly":
        return "$/hr";
      case "commission":
        return "%";
      case "booth_rent":
        return ""; // user picks one of RENT_UNITS
      case "hybrid":
        return "$/hr";
    }
  }, [compModel]);

  // Ensure unit follows model intent
  useEffectFixUnit(compModel, lockUnit, setUnit);

  // When the map picks a point (click or forward-geocode), update address fields cleanly
  const onMapChange = useCallback((loc: PickedLocation) => {
    setPicked(loc);
    // Only street in address field
    setAddressInput(loc.addressLine1 || "");
  }, []);

  // Image file -> DataURL
  async function onFileSelected(file?: File) {
    if (!file) {
      setImageDataUrl(null);
      setImagePreview(null);
      return;
    }
    const data = await readAsDataURL(file);
    setImageDataUrl(data);
    setImagePreview(URL.createObjectURL(file)); // fast preview
  }

  // Build payload respecting comp rules
  const payload = useMemo(() => {
    // Defaults
    let payMin: number | null = null;
    let payMax: number | null = null;
    let payUnit = unit || "";

    if (compModel === "hourly") {
      payUnit = "$/hr";
      payMin = toIntOrNull(wageHourly);
      payMax = null;
    } else if (compModel === "commission") {
      payUnit = "%";
      payMin = toIntOrNull(commissionPct);
      payMax = null;
    } else if (compModel === "booth_rent") {
      // only rent + one of $/d $/wk $/m
      payUnit = RENT_UNITS.includes(unit as any) ? unit : "$/wk";
      payMin = toIntOrNull(rent);
      payMax = null;
    } else if (compModel === "hybrid") {
      // commission + wage
      payUnit = "$/hr";
      payMin = toIntOrNull(commissionPct);
      payMax = toIntOrNull(wageHourly);
    }

    const loc = picked ?? undefined;

    return {
      businessName: businessName.trim(),
      title: title.trim().slice(0, 60),
      role,
      compModel,
      payMin,
      payMax,
      payUnit,
      payVisible,
      employmentType: employmentType || null,
      schedule: schedule === "any" ? null : schedule,
      experienceText: experienceText ? experienceText.slice(0, 20) : null,
      description: description.slice(0, 200),
      location: loc
        ? {
            lat: loc.lat,
            lng: loc.lng,
            addressLine1: loc.addressLine1 || "",
            city: (loc.city || "").trim(),
            state: (loc.state || "").trim(),
            postalCode: (loc.postalCode || "").trim(),
            county: (loc.county || "San Diego County").trim(),
            country: (loc.country || "US").trim(),
          }
        : null,
      photos: imageDataUrl ? [imageDataUrl] : [],
    };
  }, [
    businessName,
    title,
    role,
    compModel,
    wageHourly,
    commissionPct,
    rent,
    unit,
    payVisible,
    employmentType,
    schedule,
    experienceText,
    description,
    picked,
    imageDataUrl,
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Minimal front validations to avoid surprises
    if (!payload.businessName) return setError("Business name is required.");
    if (!payload.title) return setError("Short title is required.");
    if (!payload.location) return setError("Please set a location on the map or via address search.");

    // Enforce comp model requirements
    if (compModel === "hourly" && payload.payMin == null) return setError("Please enter an hourly wage.");
    if (compModel === "commission" && payload.payMin == null) return setError("Please enter commission (shop %).");
    if (compModel === "booth_rent" && payload.payMin == null) return setError("Please enter rent amount.");
    if (compModel === "hybrid" && (payload.payMin == null || payload.payMax == null)) {
      return setError("Please enter both commission (%) and hourly wage for hybrid.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.message || "Failed to create job");
      }

      // Go to Jobs (or listing)
      router.push("/jobs");
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  // UI toggles for comp model
  const isHourly = compModel === "hourly";
  const isCommission = compModel === "commission";
  const isRent = compModel === "booth_rent";
  const isHybrid = compModel === "hybrid";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Post a Job</h1>

      <form onSubmit={submit} className="space-y-6">
        {/* Business + Title */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Business" required>
            <input
              className="input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={50}
              placeholder="Shop or studio name"
            />
          </FormField>
          <FormField label="Short Title" hint="Max 60 chars" required>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="e.g., Chair available — commission"
            />
          </FormField>
        </div>

        {/* Service & Schedule/Employment */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Service">
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as RoleLite)}>
              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <FormField label="Schedule">
            <select className="input" value={schedule} onChange={(e) => setSchedule(e.target.value as any)}>
              <option value="any">Any</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
            </select>
          </FormField>
          <FormField label="Employment">
            <select className="input" value={employmentType} onChange={(e) => setEmploymentType(e.target.value as any)}>
              <option value="">Any</option>
              <option value="w2">Employee</option>
              <option value="c1099">Independent Contractor</option>
            </select>
          </FormField>
        </div>

        {/* Compensation */}
        <div className="rounded-2xl border border-slate-800 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <FormField label="Compensation">
              <select
                className="input"
                value={compModel}
                onChange={(e) => setCompModel(e.target.value as CompModel)}
              >
                <option value="hourly">Hourly</option>
                <option value="commission">Commission</option>
                <option value="booth_rent">Booth Rent</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </FormField>

            <FormField label="Unit">
              <select
                className="input"
                value={lockUnit || unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={lockUnit !== ""} // lock for hourly/commission/hybrid
              >
                {compModel === "booth_rent" ? (
                  <>
                    {RENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </>
                ) : (
                  <>
                    <option value="$/hr">$/hr</option>
                    <option value="%">%</option>
                  </>
                )}
              </select>
            </FormField>

            {/* Left-side value */}
            <FormField
              label={
                isHourly ? "Wage" :
                isCommission ? "Commission (shop %)" :
                isRent ? "Rent" :
                isHybrid ? "Commission (shop %)" :
                "Value"
              }
            >
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  isHourly ? wageHourly :
                  isCommission ? commissionPct :
                  isRent ? rent :
                  isHybrid ? commissionPct :
                  ""
                }
                onChange={(e) => {
                  const v = onlyDigits(e.target.value).slice(0, 5);
                  if (isHourly) setWageHourly(v);
                  else if (isCommission) setCommissionPct(v);
                  else if (isRent) setRent(v);
                  else if (isHybrid) setCommissionPct(v);
                }}
                placeholder={isCommission ? "e.g., 50" : "e.g., 25"}
              />
            </FormField>

            {/* Right-side value (only for hybrid) */}
            <FormField label={isHybrid ? "Wage ($/hr)" : "—"}>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={isHybrid ? wageHourly : ""}
                onChange={(e) => setWageHourly(onlyDigits(e.target.value).slice(0, 5))}
                placeholder="e.g., 20"
                disabled={!isHybrid}
              />
            </FormField>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={payVisible}
                onChange={(e) => setPayVisible(e.target.checked)}
              />
              Show compensation publicly
            </label>
          </div>
        </div>

        {/* Experience & Description */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Experience" hint="Optional (e.g., 2+ years). Max 20 chars">
            <input
              className="input"
              value={experienceText}
              maxLength={20}
              onChange={(e) => setExperienceText(e.target.value)}
              placeholder="Any"
            />
          </FormField>
          <FormField label="Short Description" hint="Max 200 chars">
            <textarea
              className="input resize-none"
              rows={3}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One- or two-line summary of the opportunity."
            />
          </FormField>
        </div>

        {/* Location */}
        <div className="rounded-2xl border border-slate-800 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Address" hint="Press Enter to find on map">
              <input
                className="input"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={onAddressKeyDown}
                placeholder="Street address only"
              />
            </FormField>
            <FormField label="City (auto)">
              <input
                className="input"
                value={picked?.city || ""}
                readOnly
                placeholder="Will auto-fill after picking on map"
              />
            </FormField>
          </div>

          <div className="mt-3">
            <MapPicker
              value={{ lat: picked?.lat, lng: picked?.lng }}
              searchQuery={addressSearchKey}
              onChange={onMapChange}
              height={300}
            />
          </div>
        </div>

        {/* Image upload */}
        <div className="rounded-2xl border border-slate-800 p-4">
          <FormField label="Listing Image" hint="Shown as thumbnail on Jobs">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => onFileSelected(e.target.files?.[0] || undefined)}
            />
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-36 w-64 object-cover rounded-lg border border-slate-800"
                />
              </div>
            )}
          </FormField>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <CTAButton disabled={submitting} type="submit">
            {submitting ? "Publishing…" : "Publish"}
          </CTAButton>
          <button
            type="button"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push("/jobs")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- utils ---------- */

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function toIntOrNull(s: string): number | null {
  const n = parseInt(onlyDigits(s || ""), 10);
  return Number.isFinite(n) ? n : null;
}

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function useEffectFixUnit(
  compModel: CompModel,
  lockUnit: string,
  setUnit: (u: string) => void
) {
  const [prevModel, setPrevModel] = useState<CompModel>(compModel);
  useEffect(() => {
    if (prevModel !== compModel) {
      setPrevModel(compModel);
      if (lockUnit) setUnit(lockUnit);
    }
  }, [compModel, lockUnit, prevModel, setUnit]);
}
