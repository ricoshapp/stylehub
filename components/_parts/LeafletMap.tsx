"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";

const defaultIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LeafletMap({
  center,
  onPick,
}: {
  center: { lat: number; lng: number };
  onPick: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  function Clicker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        }
        onPick(lat, lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      style={{ height: 260, width: "100%" }}
      scrollWheelZoom
      preferCanvas
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[center.lat, center.lng]}
        icon={defaultIcon}
        ref={(m) => (markerRef.current = (m as any)?.leafletElement ?? (m as any))}
      />
      <Clicker />
    </MapContainer>
  );
}
