// components/MapPane.tsx
"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Lazy-load react-leaflet on the client only
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
);
const CircleMarker = dynamic(
  async () => (await import("react-leaflet")).CircleMarker,
  { ssr: false }
);
const Popup = dynamic(
  async () => (await import("react-leaflet")).Popup,
  { ssr: false }
);

import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  location?: {
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    state?: string | null;
  } | null;
  employerProfile?: { shopName?: string | null } | null;
};

export default function MapPane({ jobs }: { jobs: Job[] }) {
  const router = useRouter();

  const points = useMemo(
    () =>
      jobs
        .map((j) => ({
          id: j.id,
          title: j.title,
          shop: j.employerProfile?.shopName ?? "Shop",
          lat: j.location?.lat ?? null,
          lng: j.location?.lng ?? null,
          city: j.location?.city ?? "San Diego",
          state: j.location?.state ?? "CA",
        }))
        .filter(
          (p) => typeof p.lat === "number" && typeof p.lng === "number"
        ) as {
          id: string;
          title: string;
          shop: string;
          lat: number;
          lng: number;
          city: string;
          state: string;
        }[],
    [jobs]
  );

  const center = useMemo(() => {
    if (points.length === 0) return [32.7157, -117.1611] as [number, number]; // San Diego
    const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return [avgLat, avgLng] as [number, number];
  }, [points]);

  return (
    <div className="rounded-xl border overflow-hidden">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: 320, width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={7}
            eventHandlers={{ click: () => router.push(`/jobs/${p.id}`) }}
          >
            <Popup>
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="text-xs text-gray-600">{p.shop}</div>
              <div className="text-xs">
                {p.city}, {p.state}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
