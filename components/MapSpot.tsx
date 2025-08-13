"use client";

import { useEffect, useRef } from "react";

export default function MapSpot({
  lat,
  lng,
  zoom = 12,
  height = 240,
}: {
  lat?: number | null;
  lng?: number | null;
  zoom?: number;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;

    let cancelled = false;
    (async () => {
      await ensureLeafletLoaded();
      if (cancelled || !containerRef.current) return;
      const L = (window as any).L;

      // init
      mapRef.current = L.map(containerRef.current, {
        center: [lat, lng],
        zoom,
        attributionControl: false,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapRef.current);
      L.control.attribution({ position: "bottomright", prefix: false }).addAttribution("© OpenStreetMap").addTo(mapRef.current);

      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);

      // fix blank tiles after mount
      setTimeout(() => {
        try { mapRef.current?.invalidateSize(); } catch {}
      }, 80);

      const onResize = () => {
        try { mapRef.current?.invalidateSize(); } catch {}
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    })();

    return () => {
      cancelled = true;
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [lat, lng, zoom]);

  // keep marker in sync if coords change
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat != null && lng != null) {
      try {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.panTo([lat, lng]);
      } catch {}
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-900"
      style={{ height }}
      aria-label="Map"
    />
  );
}

async function ensureLeafletLoaded(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).L) return;

  await new Promise<void>((resolve) => {
    const existing = document.querySelector('link[data-leaflet="css"]') as HTMLLinkElement | null;
    if (existing) return resolve();
    const link = document.createElement("link");
    link.setAttribute("data-leaflet", "css");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

  await new Promise<void>((resolve, reject) => {
    if ((window as any).L) return resolve();
    const s = document.createElement("script");
    s.setAttribute("data-leaflet", "js");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    s.crossOrigin = "";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(s);
  });
}
