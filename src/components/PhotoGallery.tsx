"use client";

import Image from "next/image";
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
          {/* 3-up grid in a ≤560px column → ~180px slots; the 200px thumb is the right source. */}
          <Image src={p.thumb} alt={p.caption || ""} fill sizes="(max-width: 600px) 31vw, 180px" />
        </button>
      ))}
    </div>
  );
}
