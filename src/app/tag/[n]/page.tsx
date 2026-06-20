import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRIP } from "@/data/trip";
import { enumerateDays } from "@/lib/format";
import { buildDay } from "@/lib/day";
import DayStats from "@/components/DayStats";
import GameCard from "@/components/GameCard";
import PhotoGallery from "@/components/PhotoGallery";
import MapClient from "@/components/MapClient";

const DAY_ISOS = enumerateDays(TRIP.meta.start, TRIP.meta.end);

export function generateStaticParams() {
  return DAY_ISOS.map((_, i) => ({ n: String(i + 1) }));
}

function parseN(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const num = Number(n);
  return num >= 1 && num <= DAY_ISOS.length ? num : null;
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const num = parseN(n);
  if (!num) return { title: "Tag — WM-Roadtrip 2026" };
  const day = buildDay(DAY_ISOS[num - 1]);
  const title = day.info?.title ? `Tag ${num}: ${day.info.title}` : `Tag ${num}`;
  return { title: `${title} — WM-Roadtrip 2026` };
}

export default async function TagPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = parseN(n);
  if (!num) notFound();

  const day = buildDay(DAY_ISOS[num - 1]);
  const { dayNum, fmt, info, isMatch, game, flights, drives, postMatchDrives, hotel, photos, km } = day;

  const hero = photos.find((p) => p.w >= p.h) ?? photos[0];
  const prev = num > 1 ? num - 1 : null;
  const next = num < DAY_ISOS.length ? num + 1 : null;

  const Nav = () => (
    <nav className="tag-nav">
      {prev ? <Link href={`/tag/${prev}`} className="tag-nav-link" prefetch>← Tag {prev}</Link> : <span className="tag-nav-link disabled">←</span>}
      <Link href="/#plan" className="tag-nav-home" prefetch>Übersicht</Link>
      {next ? <Link href={`/tag/${next}`} className="tag-nav-link" prefetch>Tag {next} →</Link> : <span className="tag-nav-link disabled">→</span>}
    </nav>
  );

  return (
    <div className="tag-detail">
      <Nav />

      {hero && (
        <div className="tag-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.full} alt={info?.title || fmt.full} />
        </div>
      )}

      <header className="tag-head">
        <div className={"tag-eyebrow" + (isMatch ? " match" : "")}>
          Tag {String(dayNum).padStart(2, "0")} · {fmt.full}
        </div>
        <h1 className="tag-title">{info?.title ?? fmt.full}</h1>
        {info?.subtitle && <p className="tag-subtitle">{info.subtitle}</p>}
        <DayStats states={info?.states} km={km} photoCount={photos.length} />
      </header>

      {isMatch && game && (
        <section className="tag-section">
          <GameCard game={game.game} index={game.index} />
        </section>
      )}

      {(flights.length > 0 || drives.length > 0 || postMatchDrives.length > 0) && (
        <section className="tag-section tag-legs">
          {flights.map((f) => (
            <div key={f.id} className="tag-leg">
              <div className="tag-leg-type">Flug · {f.depart} → {f.arrive}</div>
              <div className="tag-leg-title">{f.from.city} ({f.from.code}) → {f.to.city} ({f.to.code})</div>
              <div className="tag-leg-sub">{f.airline} {f.number} · {f.duration}{f.note ? ` · ${f.note}` : ""}</div>
            </div>
          ))}
          {[...drives, ...postMatchDrives].map((d) => (
            <div key={d.id} className="tag-leg">
              <div className="tag-leg-type">{d.afterGame ? "Heimfahrt nach dem Spiel" : "Fahrt"}</div>
              <div className="tag-leg-title">{d.from} → {d.to}</div>
              <div className="tag-leg-sub">~{d.km} km · ~{d.hrs} h</div>
            </div>
          ))}
        </section>
      )}

      {photos.length > 0 && (
        <section className="tag-section">
          <h2 className="tag-section-head">Fotos</h2>
          <PhotoGallery photos={photos} />
        </section>
      )}

      <section className="tag-section">
        <h2 className="tag-section-head">Auf der Karte</h2>
        <div className="tag-map">
          <MapClient interactive className="map-host fill" focusDay={dayNum} />
        </div>
      </section>

      {hotel && (
        <section className="tag-section">
          <h2 className="tag-section-head">Übernachtung</h2>
          <div className="tag-hotel">
            {hotel.photo && (
              <div className="stay-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hotel.photo} alt={hotel.name} loading="lazy" />
              </div>
            )}
            <div>
              <div className="tag-hotel-name">{hotel.name}</div>
              <div className="tag-hotel-city">{hotel.city}</div>
              {hotel.notes && <div className="tag-hotel-notes">{hotel.notes}</div>}
            </div>
          </div>
        </section>
      )}

      <Nav />
    </div>
  );
}
