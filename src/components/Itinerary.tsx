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
        const drives = TRIP.drives.filter((d) => d.date === iso);
        const activeHotel = TRIP.hotels.find(
          (h) => h.checkIn <= iso && iso < h.checkOut
        );
        const isCheckOut = TRIP.hotels.some((h) => h.checkOut === iso);

        const hasAnyEvent =
          flights.length > 0 ||
          drives.length > 0 ||
          isMatch ||
          !!activeHotel ||
          isCheckOut;

        return (
          <article key={iso} className="day-block">
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
                  <div className="type">Fahrt</div>
                  <div className="title">
                    {d.from} → {d.to}
                  </div>
                  <div className="sub">
                    ~{d.km} km · ~{d.hrs} h
                  </div>
                </div>
              ))}

              {gameEntry ? (
                <GameCard game={gameEntry.game} index={gameEntry.index} />
              ) : null}

              {activeHotel ? <StayBlock hotel={activeHotel} /> : null}

              {isCheckOut && !activeHotel ? (
                <div className="event event-hotel">
                  <div className="type">Check-out</div>
                  <div className="title">Weiterreise</div>
                  <div className="sub">{fmt.weekday}</div>
                </div>
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
