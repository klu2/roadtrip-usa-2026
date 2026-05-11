import Link from "next/link";
import type { Metadata } from "next";
import MapClient from "@/components/MapClient";

export const metadata: Metadata = {
  title: "Karte — WM-Roadtrip 2026",
};

export default function KartePage() {
  return (
    <div className="karte-page">
      <header className="karte-header">
        <Link href="/" className="karte-back" prefetch>
          ← Übersicht
        </Link>
        <div className="karte-title">WM-Roadtrip · Karte</div>
        <div className="karte-spacer" aria-hidden="true" />
      </header>
      <div className="karte-map">
        <MapClient interactive className="map-host fill" />
      </div>
    </div>
  );
}
