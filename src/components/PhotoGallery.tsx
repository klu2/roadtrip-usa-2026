"use client";

import type { TripPhoto } from "@/data/trip.types";

export default function PhotoGallery({ photos }: { photos: TripPhoto[] }) {
  if (!photos.length) return null;

  const slides = photos.map((p) => ({ src: p.full, alt: p.caption || "", caption: p.caption || "" }));
  const open = (index: number) =>
    window.dispatchEvent(new CustomEvent("lightbox:open", { detail: { slides, index } }));

  return (
    <div className="photo-gallery">
      {photos.map((p, i) => (
        <button type="button" className="photo-gallery-item" key={p.id} onClick={() => open(i)} aria-label="Foto vergrößern">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.thumb} alt={p.caption || ""} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
