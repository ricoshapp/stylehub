"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";

export default function RLViewport({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    const current = map.getCenter();
    const delta =
      Math.abs(current.lat - center[0]) + Math.abs(current.lng - center[1]);

    // Skip tiny moves
    if (delta < 1e-6 && map.getZoom() === zoom) return;

    map.flyTo(center as L.LatLngExpression, zoom, {
      animate: true,
      duration: 0.5,
    });
  }, [map, center, zoom]);

  return null;
}
