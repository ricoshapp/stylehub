"use client";

import { useState } from "react";

const FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
     <defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='#0b1220'/><stop offset='1' stop-color='#111827'/></linearGradient></defs>
     <rect width='100%' height='100%' fill='url(#g)'/>
     <g fill='#2f3b55'>
       <rect x='60' y='120' width='680' height='28' rx='14'/>
       <rect x='60' y='170' width='520' height='26' rx='13'/>
       <rect x='60' y='220' width='420' height='24' rx='12'/>
     </g>
   </svg>`
)}`;

export default function SafeImage({
  src,
  alt,
  className,
  fallback = "/placeholder.jpg",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  /** we try /placeholder.jpg first; if that 404s, we swap to an inline SVG */
  fallback?: string;
}) {
  const [url, setUrl] = useState<string>(src || fallback || FALLBACK_SVG);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt || ""}
      className={className}
      onError={() => setUrl(fallback || FALLBACK_SVG)}
      // last-resort: if /placeholder.jpg also fails, switch to SVG
      onLoad={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        if (el.naturalWidth === 0) setUrl(FALLBACK_SVG);
      }}
    />
  );
}