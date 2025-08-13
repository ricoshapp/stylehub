// components/PhotoGrid.tsx
import React from "react";

type Photo = { url: string };
export default function PhotoGrid({ photos }: { photos?: Photo[] }) {
  const list = Array.isArray(photos) ? photos.filter(Boolean) : [];
  if (list.length === 0) {
    // graceful fallback
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-300">
        No photos yet.
      </div>
    );
  }

  // Normalized helpers
  const Img = ({ src, className }: { src: string; className?: string }) => (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`h-full w-full object-cover ${className ?? ""}`}
    />
  );

  if (list.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="aspect-[16/9]">
          <Img src={list[0].url} />
        </div>
      </div>
    );
  }

  if (list.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-slate-800">
        {list.slice(0, 2).map((p, i) => (
          <div key={i} className="aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden">
            <Img src={p.url} />
          </div>
        ))}
      </div>
    );
  }

  if (list.length === 3) {
    return (
      <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-2xl border border-slate-800">
        <div className="col-span-2 aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden">
          <Img src={list[0].url} />
        </div>
        <div className="grid gap-2">
          {list.slice(1, 3).map((p, i) => (
            <div key={i} className="aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden">
              <Img src={p.url} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4+ photos -> 2x2 grid of first four
  return (
    <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-slate-800">
      {list.slice(0, 4).map((p, i) => (
        <div key={i} className="aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden">
          <Img src={p.url} />
        </div>
      ))}
    </div>
  );
}
