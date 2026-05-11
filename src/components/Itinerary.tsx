import { TRIP } from "@/data/trip";
import type { Hotel } from "@/data/trip.types";
import { enumerateDays, fmtDate } from "@/lib/format";

type EventKind = "flight" | "drive" | "hotel" | "game" | "free";

interface DayEvent {
  type: EventKind;
  typeLabel: string;
  title: string;
  sub: string;
}

const buildEventsByDate = (): Record<string, DayEvent[]> => {
  const out: Record<string, DayEvent[]> = {};
  const add = (iso: string, evt: DayEvent) => {
    (out[iso] = out[iso] || []).push(evt);
  };

  TRIP.flights.forEach((f) =>
    add(f.date, {
      type: "flight",
      typeLabel: "Flug",
      title: `${f.from.city} (${f.from.code}) → ${f.to.city} (${f.to.code})`,
      sub: `${f.airline} ${f.number} · ${f.depart} → ${f.arrive}`,
    })
  );
  TRIP.drives.forEach((d) =>
    add(d.date, {
      type: "drive",
      typeLabel: "Fahrt",
      title: `${d.from} → ${d.to}`,
      sub: `~${d.km} km · ~${d.hrs} h`,
    })
  );
  TRIP.hotels.forEach((h) => {
    const co = fmtDate(h.checkOut);
    add(h.checkIn, {
      type: "hotel",
      typeLabel: "Check-in",
      title: h.name,
      sub: `${h.city} · bis ${co.day}. ${co.month}`,
    });
  });
  TRIP.games.forEach((g, i) =>
    add(g.date, {
      type: "game",
      typeLabel: `Spieltag ${i + 1}`,
      title: `${g.home} vs ${g.away}`,
      sub: `${g.stadium}, ${g.city} · ${g.kickoff} (Wien: ${g.kickoffVie || "—"})`,
    })
  );

  return out;
};

const StayBlock = ({ hotel }: { hotel: Hotel }) => {
  const ci = fmtDate(hotel.checkIn);
  const co = fmtDate(hotel.checkOut);
  return (
    <div className="stay-block">
      <div className={"stay-photo" + (hotel.photo ? "" : " empty")}>
        {hotel.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hotel.photo} alt={hotel.name} />
        ) : (
          <span className="stay-photo-fallback">Foto</span>
        )}
      </div>
      <div className="stay-body">
        <div className="stay-label">Übernachtung</div>
        <div className="stay-name">{hotel.name}</div>
        <div className="stay-meta">
          {hotel.city} · {ci.day}.{ci.monthShort} – {co.day}.{co.monthShort}
        </div>
        {hotel.mapUrl ? (
          <a className="stay-link" href={hotel.mapUrl} target="_blank" rel="noopener">
            Auf Karte öffnen ↗
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default function Itinerary() {
  const days = enumerateDays(TRIP.meta.start, TRIP.meta.end);
  const eventsByDate = buildEventsByDate();
  const matchDates = new Set(TRIP.games.map((g) => g.date));

  return (
    <div className="itinerary">
      {days.map((iso) => {
        const fmt = fmtDate(iso);
        const evts = eventsByDate[iso] || [];
        const isMatch = matchDates.has(iso);
        const activeHotel = TRIP.hotels.find(
          (h) => h.checkIn <= iso && iso < h.checkOut
        );

        return (
          <div key={iso} className={"day" + (isMatch ? " match-day" : "")}>
            <div className="date-chip">
              <div className="day-num">{fmt.day}</div>
              <div className="month">{fmt.month}</div>
            </div>
            <div className="events">
              {evts.length === 0 ? (
                <div className="event">
                  <div className="type">Reisetag</div>
                  <div className="title">Tag frei</div>
                  <div className="sub">{fmt.weekday}</div>
                </div>
              ) : (
                evts.map((e, i) => (
                  <div key={i} className={"event event-" + e.type}>
                    <div className="type">{e.typeLabel}</div>
                    <div className="title">{e.title}</div>
                    <div className="sub">{e.sub}</div>
                  </div>
                ))
              )}
              {activeHotel ? <StayBlock hotel={activeHotel} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
