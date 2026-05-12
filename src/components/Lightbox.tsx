"use client";

import { useEffect, useState } from "react";

const ZOOMABLE_SELECTOR = ".stay-photo, .stadium-photo, .event-photo";

export default function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState<string>("");

  // Listen for clicks on any image within a zoomable container.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") return;
      const img = target as HTMLImageElement;
      if (!img.src) return;
      if (!img.closest(ZOOMABLE_SELECTOR)) return;
      e.preventDefault();
      setSrc(img.currentSrc || img.src);
      setAlt(img.alt || "");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // ESC to close + scroll lock while open.
  useEffect(() => {
    if (!src) return;
    document.body.classList.add("lightbox-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("lightbox-open");
    };
  }, [src]);

  if (!src) return null;

  return (
    <div
      className="lightbox open"
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Bild"}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSrc(null);
      }}
    >
      <button
        type="button"
        className="lb-close"
        aria-label="Schließen"
        onClick={() => setSrc(null)}
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}
