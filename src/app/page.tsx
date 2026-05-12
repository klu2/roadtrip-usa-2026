import Link from "next/link";
import MapClient from "@/components/MapClient";
import Itinerary from "@/components/Itinerary";
import { TRIP } from "@/data/trip";
import { fmtDate } from "@/lib/format";

export default function Home() {
  const m = TRIP.meta;
  const start = fmtDate(m.start);
  const end = fmtDate(m.end);
  const totalKm = TRIP.drives.reduce((sum, d) => sum + d.km, 0);

  return (
    <>
      <div className="flag-bands" />

      <div className="wrap">
        <header className="hero">
          <div className="eyebrow">
            <span className="dot" />
            <span>FIFA WM 2026 · USA</span>
          </div>
          <h1>{m.title}</h1>
          <p className="sub">{m.subtitle}</p>
          <div className="meta-row">
            <div className="meta-cell">
              <div className="k">Abreise</div>
              <div className="v">
                {start.day} {start.month}
              </div>
            </div>
            <div className="meta-cell">
              <div className="k">Rückkehr</div>
              <div className="v">
                {end.day} {end.month}
              </div>
            </div>
            <div className="meta-cell" title={`${totalKm.toLocaleString("de-DE")} km gesamt`}>
              <div className="k">Strecke</div>
              <div className="v">{totalKm.toLocaleString("de-DE")} km</div>
            </div>
          </div>
        </header>

        <section id="route">
          <div className="section-head">
            <div>
              <div className="num">01 / Die Route</div>
              <h2>Quer durch die USA</h2>
              <div className="lede">
                Von der Bay nach Texas nach Kansas City — drei Spiele, sechs
                Etappen.
              </div>
            </div>
          </div>
          <div className="map-card">
            <div className="map-frame">
              <MapClient />
              <Link
                href="/karte"
                className="map-fullscreen-btn"
                prefetch
                aria-label="Karte vergrößern"
              >
                Vergrößern ↗
              </Link>
            </div>
            <div className="legend">
              <div className="item">
                <span className="sw" />
                Spielort
              </div>
              <div className="item">
                <span className="sw hotel" />
                Hotel
              </div>
              <div className="item">
                <span className="sw line" />
                Etappe
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flag-bands" />

      <section id="plan" className="plan-section">
        <Itinerary />
      </section>

      <footer className="foot">
        <span>4 Mann</span>
        <span className="ball" />
        <span>3 Spiele</span>
        <span className="ball" />
        <span>1 Roadtrip</span>
      </footer>

      <div className="flag-bands" />
    </>
  );
}
