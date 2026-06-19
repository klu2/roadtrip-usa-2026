"use client";

import { useEffect, useRef, useState } from "react";

type Slide = { src: string; alt?: string; caption?: string };

const ZOOMABLE_SELECTOR = ".stay-photo, .stadium-photo, .event-photo";

export default function Lightbox() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const open = slides.length > 0;
  const touchX = useRef<number | null>(null);

  const close = () => setSlides([]);

  // Inline image clicks (.stay-photo / .stadium-photo / .event-photo) -> 1 slide.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.tagName !== "IMG") return;
      const img = t as HTMLImageElement;
      if (!img.src || !img.closest(ZOOMABLE_SELECTOR)) return;
      e.preventDefault();
      setSlides([{ src: img.currentSrc || img.src, alt: img.alt || "" }]);
      setIndex(0);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Programmatic gallery open (map photo markers).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as { slides?: Slide[]; index?: number };
      if (!d?.slides?.length) return;
      setSlides(d.slides);
      setIndex(Math.min(Math.max(d.index ?? 0, 0), d.slides.length - 1));
    };
    window.addEventListener("lightbox:open", onOpen as EventListener);
    return () => window.removeEventListener("lightbox:open", onOpen as EventListener);
  }, []);

  // ESC/arrows + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("lightbox-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      else if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("lightbox-open");
    };
  }, [open, slides.length]);

  if (!open) return null;
  const s = slides[index];
  const multi = slides.length > 1;
  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <div
      className="lightbox open"
      role="dialog"
      aria-modal="true"
      aria-label={s.alt || "Bild"}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (multi && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <button type="button" className="lb-close" aria-label="Schließen" onClick={close}>
        ×
      </button>
      {multi && (
        <button type="button" className="lb-nav lb-prev" aria-label="Zurück" onClick={() => go(-1)}>
          ‹
        </button>
      )}
      {multi && (
        <button type="button" className="lb-nav lb-next" aria-label="Weiter" onClick={() => go(1)}>
          ›
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.src} alt={s.alt || ""} />
      {(s.caption || multi) && (
        <div className="lb-caption">
          {s.caption && <span>{s.caption}</span>}
          {multi && <span className="lb-count">{index + 1} / {slides.length}</span>}
        </div>
      )}
    </div>
  );
}
