// components/MapPicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type PickedLocation = {
  lat: number;
  lng: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  county?: string;
  country?: string;
};

type Props = {
  /** Initial or controlled coordinates */
  value?: { lat?: number; lng?: number };
  /** A human-entered address to geocode (triggered by Enter upstream) */
  searchQuery?: string;
  /** Called when the user picks a point or geocoding succeeds */
  onChange: (loc: PickedLocation) => void;
  /** Map height */
  height?: number;
};

const SAN_DIEGO = { lat: 32.7157, lng: -117.1611, zoom: 11 };

// OpenStreetMap default marker fix for Next.js
const MarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Reverse geocode with smarter “city” selection for San Diego region. */
async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "Accept-Language": "en-US" },
    });
    const data = await res.json();
    const a = data?.address ?? {};

    // Clean street (avoid business names)
    const street =
      [a.house_number, a.road].filter(Boolean).join(" ").trim() || "";

    // Prefer true municipalities; if result is the big city “San Diego” but a suburb/neighborhood exists,
    // show that (e.g., La Jolla, Pacific Beach) for better local precision.
    let preferredCity =
      a.municipality ||
      a.city ||
      a.town ||
      a.village ||
      a.locality ||
      a.hamlet ||
      "";

    if ((!preferredCity || preferredCity === "San Diego") && (a.suburb || a.neighbourhood)) {
      preferredCity = a.suburb || a.neighbourhood || preferredCity;
    }

    return {
      addressLine1: street,
      city: preferredCity,
      state: a.state || "",
      postalCode: a.postcode || "",
      county: a.county || "",
      country: a.country_code?.toUpperCase?.() || "US",
    };
  } catch {
    return {
      addressLine1: "",
      city: "",
      state: "",
      postalCode: "",
      county: "",
      country: "US",
    };
  }
}

/** Forward geocode bounded to San Diego County to prefer local results. */
async function forwardGeocode(q: string) {
  try {
    // Rough San Diego County bounds: left,top,right,bottom
    const left = -117.60, top = 33.50, right = -116.08, bottom = 32.50;

    // Enrich query to keep results local
    const enriched = q.match(/san\s*diego/i) ? q : `${q}, San Diego County, CA`;

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=1&viewbox=${left},${top},${right},${bottom}&bounded=1&q=${encodeURIComponent(
      enriched
    )}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json", "Accept-Language": "en-US" },
    });
    const arr = await res.json();
    const first = Array.isArray(arr) ? arr[0] : null;
    if (!first) return null;

    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    const rev = await reverseGeocode(lat, lng);
    return { lat, lng, ...rev };
  } catch {
    return null;
  }
}

function FlyTo({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickDropper({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      onPick({ lat, lng });
    },
  });
  return null;
}

export default function MapPicker({ value, searchQuery, onChange, height = 300 }: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(() =>
    value?.lat && value?.lng ? { lat: value.lat!, lng: value.lng! } : null
  );

  // Address search (triggered when parent updates searchQuery after Enter)
  useEffect(() => {
    let alive = true;
    (async () => {
      const q = (searchQuery || "").trim();
      if (!q) return;
      const result = await forwardGeocode(q);
      if (!alive || !result) return;
      const { lat, lng, ...rest } = result;
      setPos({ lat, lng });
      onChange({ lat, lng, ...rest });
    })();
    return () => {
      alive = false;
    };
  }, [searchQuery, onChange]);

  // Click-to-drop marker + reverse geocode
  const handlePick = async ({ lat, lng }: { lat: number; lng: number }) => {
    setPos({ lat, lng });
    const rev = await reverseGeocode(lat, lng);
    onChange({ lat, lng, ...rev });
  };

  const center = useMemo(() => {
    if (pos) return { ...pos, zoom: 14 };
    if (value?.lat && value?.lng) return { lat: value.lat, lng: value.lng, zoom: 14 };
    return SAN_DIEGO;
  }, [pos, value?.lat, value?.lng]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={center.zoom}
      style={{ height, width: "100%", borderRadius: 12 }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />

      {pos && (
        <>
          <FlyTo lat={pos.lat} lng={pos.lng} />
          <Marker position={[pos.lat, pos.lng]} icon={MarkerIcon} />
        </>
      )}

      <ClickDropper onPick={handlePick} />
    </MapContainer>
  );
}
