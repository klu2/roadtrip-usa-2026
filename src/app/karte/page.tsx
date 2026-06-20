import Link from "next/link";
import type { Metadata } from "next";
import MapClient from "@/components/MapClient";

export const metadata: Metadata = {
  title: "Karte — WM-Roadtrip 2026",
};

interface PageProps {
  searchParams: Promise<{ focus?: string | string[]; day?: string | string[] }>;
}

export default async function KartePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const focusId = typeof params.focus === "string" ? params.focus : undefined;
  const dayRaw = typeof params.day === "string" ? params.day : undefined;
  const focusDay = dayRaw && /^\d+$/.test(dayRaw) ? Number(dayRaw) : undefined;

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
        <MapClient interactive className="map-host fill" focusId={focusId} focusDay={focusDay} />
      </div>
    </div>
  );
}
