// components/MapPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Picked = {
  lat: number;
  lng: number;
  addressLine1?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

const SD_CENTER: Picked = {
  lat: 32.7157,
  lng: -117.1611,
  city: "San Diego",
  state: "CA",
  county: "San Diego County",
  country: "US",
};

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({
  value,
  onChange,
}: {
  value: Picked | null;
  onChange: (loc: Picked) => void;
}) {
  const v = value ?? SD_CENTER;
  const [pos, setPos] = useState<[number, number]>([v.lat, v.lng]);

  useEffect(() => {
    setPos([v.lat, v.lng]);
  }, [v.lat, v.lng]);

  function Clicker() {
    useMapEvents({
      click: async (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setPos([lat, lng]);
        const details = await reverseGeocode(lat, lng);
        onChange({ ...v, lat, lng, ...details });
      },
    });
    return null;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800">
      <MapContainer
        center={pos}
        zoom={12}
        style={{ height: 260, width: "100%" }}
        scrollWheelZoom
        preferCanvas
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pos} icon={defaultIcon} />
        <Recenter lat={pos[0]} lng={pos[1]} />
        <Clicker />
      </MapContainer>
    </div>
  );
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en", "User-Agent": "stylehub-local-dev" as any }, cache: "no-store" }
    );
    const data = await res.json();
    const a = data?.address || {};
    return {
      addressLine1: data?.name || null,
      city: a.city || a.town || a.village || a.hamlet || null,
      county: a.county || "San Diego County",
      state: a.state || "CA",
      postalCode: a.postcode || null,
      country: a.country_code ? String(a.country_code).toUpperCase() : "US",
    };
  } catch {
    return { addressLine1: null, city: null, county: "San Diego County", state: "CA", postalCode: null, country: "US" };
  }
}
