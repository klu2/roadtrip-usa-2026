import { TRIP } from "@/data/trip";
import { PHOTOS } from "@/data/photos";
import { DAILY_KM } from "@/data/route-geometry";
import { enumerateDays, fmtDate, tripDay, type FormattedDate } from "@/lib/format";
import type {
  Game,
  Flight,
  Drive,
  Activity,
  Hotel,
  DayInfo,
  TripPhoto,
} from "@/data/trip.types";

export interface DayView {
  iso: string;
  /** 1-based "Tag N" index. */
  dayNum: number;
  fmt: FormattedDate;
  info?: DayInfo;
  isMatch: boolean;
  game?: { game: Game; index: number };
  flights: Flight[];
  /** Drives before the game (or any non-post-match drive). */
  drives: Drive[];
  /** Post-match drives (rendered after the game on match days). */
  postMatchDrives: Drive[];
  activities: Activity[];
  /** The hotel slept in this night, if any. */
  hotel?: Hotel;
  /** True when an unbooked night should show the placeholder. */
  showStayPlaceholder: boolean;
  /** Photos captured this local day (chronological). */
  photos: TripPhoto[];
  /** Road km driven this day (only present for driven days). */
  km?: number;
  /** Total drive hours this day (undefined when no drive). */
  hours?: number;
}

const gameIndexByDate = new Map(TRIP.games.map((g, i) => [g.date, i]));
const kmByDate = new Map(DAILY_KM.map((d) => [d.date, d.km]));

export function buildDay(iso: string): DayView {
  const dayNum = tripDay(iso, TRIP.meta.start);
  const fmt = fmtDate(iso);
  const info = TRIP.days.find((d) => d.date === iso);

  const gi = gameIndexByDate.get(iso);
  const game = gi !== undefined ? { game: TRIP.games[gi], index: gi } : undefined;

  const flights = TRIP.flights.filter((f) => f.date === iso);
  const allDrives = TRIP.drives.filter((d) => d.date === iso);
  const drives = allDrives.filter((d) => !d.afterGame);
  const postMatchDrives = allDrives.filter((d) => d.afterGame);
  const activities = TRIP.activities.filter((a) => a.date === iso);

  const hotel = TRIP.hotels.find((h) => h.checkIn <= iso && iso < h.checkOut);
  const showStayPlaceholder =
    !hotel && flights.length === 0 && iso !== TRIP.meta.end;

  // Photos are grouped by LOCAL capture date (the `time` field), not the
  // UTC-derived id — that's how a traveler thinks of "that day's photos".
  const photos = PHOTOS.filter((p) => p.time.slice(0, 10) === iso);

  const km = kmByDate.get(iso);
  const driveHours = allDrives.reduce((s, d) => s + d.hrs, 0);
  const hours = driveHours > 0 ? driveHours : undefined;

  return {
    iso, dayNum, fmt, info,
    isMatch: !!game, game,
    flights, drives, postMatchDrives, activities,
    hotel, showStayPlaceholder,
    photos, km, hours,
  };
}

export function buildAllDays(): DayView[] {
  return enumerateDays(TRIP.meta.start, TRIP.meta.end).map(buildDay);
}
