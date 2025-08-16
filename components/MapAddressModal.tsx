"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { X } from "lucide-react";

// Default SD county-ish center
const SD_CENTER: [number, number] = [32.877, -117.099];

// Fix the default marker icon path for Leaflet in Next
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type Picked = {
  lat: number;
  lng: number;
  address: string;
};

export default function MapAddressModal({
  initialAddress,
  onClose,
  onSelect,
}: {
  initialAddress?: string;
  onClose: () => void;
  onSelect: (picked: Picked) => void;
}) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);

  // Try to forward geocode when modal opens with a typed address
  useEffect(() => {
    (async () => {
      const q = (initialAddress || "").trim();
      if (!q) return;
      try {
        setBusy(true);
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
          q + " San Diego County, California"
        )}`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setPos([lat, lon]);
          }
        }
      } finally {
        setBusy(false);
      }
    })();
  }, [initialAddress]);

  // Click handler: drop a pin on exact click and reverse geocode to a clean street address (no business)
  function ClickCatcher() {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        setPos([lat, lng]);
        setBusy(true);
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
          const res = await fetch(url, { headers: { "Accept-Language": "en" } });
          if (res.ok) {
            const data = await res.json();
            const a = data.address || {};
            const road = a.road || a.pedestrian || a.path || "";
            const hn = a.house_number ? `${a.house_number} ` : "";
            // Just street line; omit business names
            const line = (hn + road).trim() || data.display_name || "Dropped pin";
            setAddress(line);
          } else {
            setAddress("Dropped pin");
          }
        } catch {
          setAddress("Dropped pin");
        } finally {
          setBusy(false);
        }
      },
    });
    return null;
  }

  // Camera helper: center to current pos smoothly
  function Camera() {
    const map = useMap();
    useEffect(() => {
      if (pos) {
        map.flyTo(pos, 14, { animate: true });
      }
    }, [map, pos]);
    return null;
  }

  const center = useMemo<[number, number]>(() => pos ?? SD_CENTER, [pos]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-zinc-950">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="text-sm text-slate-300">
            {busy ? "Finding location…" : "Click map to drop a pin, then Use this location"}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="text-xs text-slate-400">Address</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const q = address.trim();
                if (!q) return;
                setBusy(true);
                try {
                  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
                    q + " San Diego County, California"
                  )}`;
                  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
                  if (res.ok) {
                    const data = await res.json();
                    if (data && data[0]) {
                      const lat = parseFloat(data[0].lat);
                      const lon = parseFloat(data[0].lon);
                      setPos([lat, lon]);
                    }
                  }
                } finally {
                  setBusy(false);
                }
              }
            }}
            placeholder="Type an address and press Enter, or click the map"
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm outline-none"
          />

          <div className="h-[360px] w-full overflow-hidden rounded-lg">
            <MapContainer
              center={center}
              zoom={12}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickCatcher />
              <Camera />
              {pos && <Marker position={pos} />}
            </MapContainer>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button
              onClick={() => {
                const [lat, lng] = pos ?? center;
                onSelect({ lat, lng, address: address.trim() || "Dropped pin" });
                onClose();
              }}
              className="rounded-md bg-green-500 text-black px-3 py-1.5 text-sm font-semibold hover:bg-green-400"
            >
              Use this location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
