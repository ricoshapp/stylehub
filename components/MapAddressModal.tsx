"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, LocateFixed, MapPin, Search } from "lucide-react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const RLClickHandler = dynamic(() => import("./RLClickHandler"), {
  ssr: false,
});

// Ensure Leaflet marker icons load in Next
(function ensureLeafletIcons() {
  const iconRetinaUrl =
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
  const iconUrl =
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
  const shadowUrl =
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
  // @ts-ignore
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
})();

// San Diego County bounds (approx)
const SD_BBOX = { west: -117.6, east: -116.0, north: 33.5, south: 32.5 };
const SD_CENTER: [number, number] = [32.83, -117.15];

function inSDBounds(lat: number, lng: number) {
  return (
    lng >= SD_BBOX.west &&
    lng <= SD_BBOX.east &&
    lat <= SD_BBOX.north &&
    lat >= SD_BBOX.south
  );
}

// Build a clean street line from Nominatim address parts (no business/POI names)
function formatAddressFromParts(a: any, fallback: string) {
  if (!a) return fallback;
  const cityLike = a.city || a.town || a.village || a.hamlet;
  const parts = [
    [a.house_number, a.road].filter(Boolean).join(" ").trim(),
    [cityLike, a.state].filter(Boolean).join(", ").trim(),
    a.postcode,
  ].filter(Boolean);
  const line = parts.join(", ").trim();
  return line || fallback;
}

type Out = { lat: number; lng: number; address: string };

export default function MapAddressModal({
  open,
  initial,
  onClose,
  onSelect,
}: {
  open: boolean;
  initial?: { lat?: number; lng?: number; address?: string };
  onClose: () => void;
  onSelect: (o: Out) => void;
}) {
  const [address, setAddress] = useState(initial?.address ?? "");
  const [pos, setPos] = useState<[number, number] | null>(
    initial?.lat && initial?.lng ? [initial.lat, initial.lng] : null
  );
  const [error, setError] = useState("");

  // Force-remount key for MapContainer → guarantees recentering
  const [mapKey, setMapKey] = useState(0);

  // Reset state when opening
  useEffect(() => {
    if (!open) return;
    setAddress(initial?.address ?? "");
    const nextPos =
      initial?.lat && initial?.lng ? [initial.lat, initial.lng] : null;
    setPos(nextPos);
    setError("");
    setMapKey((k) => k + 1); // ensure map mounts centered when modal opens
  }, [open, initial?.address, initial?.lat, initial?.lng]);

  // Whenever position changes, remount the map so it centers on the marker
  useEffect(() => {
    setMapKey((k) => k + 1);
  }, [pos?.[0], pos?.[1]]);

  async function reverseGeocode(lat: number, lng: number) {
    if (!inSDBounds(lat, lng)) {
      setError("Please pick a spot inside San Diego County, CA.");
      return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    }
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      const clean = formatAddressFromParts(
        data?.address,
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      );
      const county = (data?.address?.county || "").toLowerCase();
      const state = (data?.address?.state || "").toLowerCase();
      const inCounty =
        county.includes("san diego") && state.includes("california");
      setError(inCounty ? "" : "That point may be outside San Diego County.");
      setAddress(clean);
      return { address: clean };
    } catch {
      setError("Could not fetch address for that point.");
      return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    }
  }

  async function geocode() {
    const qRaw = address.trim();
    if (!qRaw) return;

    const vbox = `${SD_BBOX.west},${SD_BBOX.north},${SD_BBOX.east},${SD_BBOX.south}`;
    // 1) bounded, 2) fallback unbounded but verify coords are in county
    const urls = [
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&bounded=1&viewbox=${encodeURIComponent(
        vbox
      )}&countrycodes=us&q=${encodeURIComponent(qRaw)}`,
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=us&q=${encodeURIComponent(
        qRaw + " San Diego County CA"
      )}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const arr = (await res.json()) as Array<{
          lat: string;
          lon: string;
          address?: any;
        }>;
        if (!arr?.length) continue;

        const { lat, lon, address: a } = arr[0];
        const latNum = parseFloat(lat),
          lngNum = parseFloat(lon);
        if (!inSDBounds(latNum, lngNum)) continue;

        const clean = formatAddressFromParts(a, qRaw);

        setError("");
        setAddress(clean);
        setPos([latNum, lngNum]); // triggers map remount & re-center
        return;
      } catch {
        // try next
      }
    }
    setError(
      "No address found inside San Diego County. Try number + street + city."
    );
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude, longitude } = p.coords;
        setPos([latitude, longitude]); // triggers map remount & re-center
        await reverseGeocode(latitude, longitude);
      },
      () => setError("Could not get your current location."),
      { timeout: 8000 }
    );
  };

  const accept = async () => {
    if (!pos) {
      setError("Pick a point on the map or search an address first.");
      return;
    }
    const [lat, lng] = pos;
    const rev = await reverseGeocode(lat, lng);
    onSelect({ lat, lng, address: rev.address }); // do NOT return city
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-800">
          <MapPin className="h-5 w-5 text-slate-200" />
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-zinc-900 px-2 py-2">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  geocode();
                }
              }}
              placeholder="Search address in San Diego County (press Enter)"
              className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400"
            />
            <button
              onClick={geocode}
              className="text-xs px-2 py-1 rounded bg-white text-black hover:bg-slate-100"
            >
              Set
            </button>
          </div>
          <button
            onClick={useMyLocation}
            title="Use my location"
            className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-zinc-900"
          >
            <LocateFixed className="h-4 w-4" />
            Current
          </button>
          <button
            onClick={onClose}
            className="ml-2 rounded-lg border border-slate-800 p-2 hover:bg-zinc-900"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Map */}
        <div className="h-[380px] relative">
          <MapContainer
            key={mapKey} // <- re-mount to enforce new center
            center={pos ?? SD_CENTER}
            zoom={pos ? 14 : 10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pos && <Marker position={pos} />}
            <RLClickHandler
              onClick={async (lat, lng) => {
                setPos([lat, lng]); // triggers map remount & re-center
                await reverseGeocode(lat, lng);
              }}
            />
          </MapContainer>

          {error && (
            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-red-600/90 text-white text-xs px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-emerald-500 text-black px-5 py-2 text-sm font-semibold hover:bg-emerald-400"
          >
            Use this location
          </button>
        </div>
      </div>
    </div>
  );
}
