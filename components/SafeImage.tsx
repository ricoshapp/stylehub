// components/SafeImage.tsx
"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
};

export default function SafeImage({
  src,
  alt = "",
  className,
  fallbackSrc = "/placeholder.jpg",
}: Props) {
  const [err, setErr] = useState(false);
  const finalSrc = !src || err ? fallbackSrc : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={clsx("w-full h-full object-cover", className)}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}
