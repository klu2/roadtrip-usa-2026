import { TRIP } from "@/data/trip";
import { enumerateDays, tripDay } from "@/lib/format";

export default function DayJumpRow() {
  // Drop the trip's final arrival day from the jump bar — 18 days fit cleanly as 9 + 9.
  const days = enumerateDays(TRIP.meta.start, TRIP.meta.end).slice(0, 18);
  const matchDates = new Set(TRIP.games.map((g) => g.date));

  return (
    <nav className="day-jump" aria-label="Zu Tag springen">
      {days.map((iso) => {
        const dayNum = tripDay(iso, TRIP.meta.start);
        const isMatch = matchDates.has(iso);
        return (
          <a
            key={iso}
            href={`#tag-${dayNum}`}
            className={"day-chip" + (isMatch ? " match" : "")}
            aria-label={`Tag ${dayNum}${isMatch ? " · Spieltag" : ""}`}
          >
            {dayNum}
          </a>
        );
      })}
    </nav>
  );
}
