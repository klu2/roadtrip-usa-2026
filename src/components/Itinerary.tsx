import Link from "next/link";
import { TRIP } from "@/data/trip";
import {
  enumerateDays,
  fmtDate,
  nightsCount,
  tripDay,
} from "@/lib/format";
import type { Hotel } from "@/data/trip.types";
import GameCard from "./GameCard";

const CarIcon = () => (
  <svg
    className="car-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 16 H21" />
    <path d="M5 16 L5 13 L7.5 9 H16.5 L19 13 L19 16" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="8" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const BedIcon = () => (
  <svg
    className="bed-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 5 L3 18" />
    <path d="M3 14 L21 14" />
    <path d="M3 18 L21 18" />
    <path d="M21 14 L21 18" />
    <path d="M5 14 L5 10 L11 10 L11 14" />
  </svg>
);

const StayPlaceholder = () => (
  <div className="stay-block stay-placeholder">
    <div className="stay-photo empty">
      <span className="stay-photo-fallback">?</span>
    </div>
    <div className="stay-body">
      <div className="stay-label">
        <BedIcon />
        <span>Übernachtung</span>
      </div>
      <div className="stay-name">Noch nicht gebucht</div>
      <div className="stay-meta">Hotel folgt — Etappe noch offen</div>
    </div>
  </div>
);

const StayBlock = ({ hotel }: { hotel: Hotel }) => {
  const ci = fmtDate(hotel.checkIn);
  const co = fmtDate(hotel.checkOut);
  const nights = nightsCount(hotel.checkIn, hotel.checkOut);
  const nightLabel = nights === 1 ? "1 Nacht" : `${nights} Nächte`;
  return (
    <div className="stay-block">
      <div className={"stay-photo" + (hotel.photo ? "" : " empty")}>
        {hotel.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hotel.photo} alt={hotel.name} />
        ) : (
          <span className="stay-photo-fallback">Foto folgt</span>
        )}
      </div>
      <div className="stay-body">
        <div className="stay-label">
          <BedIcon />
          <span>Übernachtung</span>
        </div>
        <div className="stay-name">{hotel.name}</div>
        <div className="stay-meta">
          {hotel.city} · {ci.day}. {ci.monthShort} – {co.day}. {co.monthShort} ·{" "}
          {nightLabel}
        </div>
        <Link className="stay-link" href={`/karte?focus=${hotel.id}`} prefetch>
          Auf Karte zeigen →
        </Link>
      </div>
    </div>
  );
};

export default function Itinerary() {
  const days = enumerateDays(TRIP.meta.start, TRIP.meta.end);
  const gameByDate = new Map(
    TRIP.games.map((g, i) => [g.date, { game: g, index: i }])
  );

  return (
    <div className="itinerary">
      {days.map((iso, idx) => {
        const fmt = fmtDate(iso);
        const dayNum = tripDay(iso, TRIP.meta.start);
        const gameEntry = gameByDate.get(iso);
        const isMatch = !!gameEntry;
        const isLast = idx === days.length - 1;

        const flights = TRIP.flights.filter((f) => f.date === iso);
        const allDrives = TRIP.drives.filter((d) => d.date === iso);
        const drives = allDrives.filter((d) => !d.afterGame);
        const postMatchDrives = allDrives.filter((d) => d.afterGame);
        const activities = TRIP.activities.filter((a) => a.date === iso);
        const activeHotel = TRIP.hotels.find(
          (h) => h.checkIn <= iso && iso < h.checkOut
        );

        // Show a "noch nicht gebucht" placeholder on unbooked nights —
        // skip the trip's final day (arrival home, no overnight needed)
        // and skip days that are pure travel (flights cover the night).
        const showStayPlaceholder =
          !activeHotel && flights.length === 0 && iso !== TRIP.meta.end;

        const hasAnyEvent =
          flights.length > 0 ||
          allDrives.length > 0 ||
          activities.length > 0 ||
          isMatch ||
          !!activeHotel ||
          showStayPlaceholder;

        return (
          <article key={iso} id={`tag-${dayNum}`} className="day-block">
            <header className={"day-header" + (isMatch ? " match" : "")}>
              <div className="day-header-inner">
                <h3 className="day-mark">
                  <span className="tag">Tag</span>
                  <span className="num">{String(dayNum).padStart(2, "0")}</span>
                </h3>
                <div className="day-rule" aria-hidden="true" />
                <div className="day-date" aria-label={`${fmt.weekday}, ${fmt.day}. ${fmt.month}`}>
                  <span className="weekday">{fmt.weekday}</span>
                  <span className="day-num">{fmt.day}</span>
                </div>
              </div>
            </header>

            <div className="day-body">
              {flights.map((f) => (
                <div key={f.id} className="event event-flight">
                  <div className="type">
                    Flug · {f.depart} → {f.arrive}
                  </div>
                  <div className="title">
                    {f.from.city} ({f.from.code}) → {f.to.city} ({f.to.code})
                  </div>
                  <div className="sub">
                    {f.airline} {f.number} · {f.duration}
                    {f.note ? ` · ${f.note}` : ""}
                  </div>
                </div>
              ))}

              {drives.map((d) => (
                <div key={d.id} className="event event-drive">
                  <div className="type">
                    <CarIcon />
                    Fahrt
                  </div>
                  <div className="title">
                    {d.from} → {d.to}
                  </div>
                  <div className="sub">
                    ~{d.km} km · ~{d.hrs} h
                  </div>
                </div>
              ))}

              {activities.map((a) => (
                <div
                  key={a.id}
                  className={
                    "event event-activity" + (a.photo ? " has-photo" : "")
                  }
                >
                  {a.photo ? (
                    <div className="event-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.photo} alt={a.title} loading="lazy" />
                    </div>
                  ) : null}
                  <div className="event-content">
                    <div className="type">
                      Aktivität{a.time ? ` · ${a.time}` : ""}
                    </div>
                    <div className="title">{a.title}</div>
                    {a.subtitle ? (
                      <div className="sub">{a.subtitle}</div>
                    ) : null}
                  </div>
                </div>
              ))}

              {gameEntry ? (
                <GameCard game={gameEntry.game} index={gameEntry.index} />
              ) : null}

              {postMatchDrives.map((d) => (
                <div key={d.id} className="event event-drive">
                  <div className="type">
                    <CarIcon />
                    Heimfahrt nach dem Spiel
                  </div>
                  <div className="title">
                    {d.from} → {d.to}
                  </div>
                  <div className="sub">
                    ~{d.km} km · ~{d.hrs} h
                  </div>
                </div>
              ))}

              {activeHotel ? (
                <StayBlock hotel={activeHotel} />
              ) : showStayPlaceholder ? (
                <StayPlaceholder />
              ) : null}

              {!hasAnyEvent ? (
                <div className="event event-rest">
                  <div className="type">Aufenthalt</div>
                  <div className="title">Ruhetag</div>
                  <div className="sub">{fmt.weekday}</div>
                </div>
              ) : null}
            </div>

            {!isLast ? (
              <div
                className="flag-bands thin day-separator"
                aria-hidden="true"
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
