import MapClient from "@/components/MapClient";
import GameCard from "@/components/GameCard";
import Itinerary from "@/components/Itinerary";
import { TRIP } from "@/data/trip";
import { fmtDate } from "@/lib/format";

export default function Home() {
  const m = TRIP.meta;
  const start = fmtDate(m.start);
  const end = fmtDate(m.end);

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
            <div className="meta-cell" title={m.crew.join(" · ")}>
              <div className="k">Truppe</div>
              <div className="v">{m.crew.length} Mann</div>
            </div>
          </div>
        </header>

        <section id="route">
          <div className="section-head">
            <div>
              <div className="num">01 / Die Route</div>
              <h2>Quer durch die USA</h2>
              <div className="lede">
                Von der Bay nach Texas nach Kansas City — drei Spiele, sechs Etappen.
              </div>
            </div>
          </div>
          <div className="map-card">
            <MapClient />
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

        <div className="flag-bands thin" style={{ margin: "24px 0 8px" }} />

        <section id="games">
          <div className="section-head">
            <div>
              <div className="num">02 / Die Spiele</div>
              <h2>Drei Spiele</h2>
              <div className="lede">
                Gruppe J: Argentinien, Algerien, Österreich, Jordanien.
              </div>
            </div>
          </div>
          <div className="games-list">
            {TRIP.games.map((g, i) => (
              <GameCard key={g.id} game={g} index={i} />
            ))}
          </div>
        </section>

        <section id="plan">
          <div className="section-head">
            <div>
              <div className="num">03 / Tag für Tag</div>
              <h2>Der Plan</h2>
              <div className="lede">
                Flüge, Fahrten, Hotels, Anpfiffe. Später kommen Fotos und Schmäh dazu.
              </div>
            </div>
          </div>
          <Itinerary />
        </section>
      </div>

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
