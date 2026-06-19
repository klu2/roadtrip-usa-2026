/* ============================================================
   WM-Roadtrip 2026 — Type definitions for trip data.
   Pure type module; no runtime values.
   ============================================================ */

export type Coords = [number, number];

export interface TripMeta {
  title: string;
  subtitle: string;
  start: string;
  end: string;
  crew: string[];
}

export interface Game {
  id: string;
  date: string;
  kickoff: string;
  kickoffVie: string;
  home: string;
  homeFlag: string;
  away: string;
  awayFlag: string;
  stadium: string;
  stadiumPhoto?: string;
  city: string;
  coords: Coords;
  tournamentName: string;
  capacity: number;
  /** We walked from the hotel — show the marker, but no drive line to it. */
  reachedOnFoot?: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  coords: Coords;
  checkIn: string;
  checkOut: string;
  photo?: string;
  notes?: string;
}

export interface Flight {
  id: string;
  date: string;
  airline: string;
  number: string;
  from: { code: string; city: string };
  to: { code: string; city: string };
  depart: string;
  arrive: string;
  duration: string;
  cls: string;
  note?: string;
}

export interface Drive {
  id: string;
  date: string;
  from: string;
  to: string;
  km: number;
  hrs: number;
  /** Render after the game card on match days (post-match drive home). */
  afterGame?: boolean;
}

export interface Activity {
  id: string;
  date: string;
  time?: string;
  title: string;
  subtitle?: string;
  city?: string;
  photo?: string;
}

export interface Booking {
  airline: string;
  confirmation: string;
}

export interface DayInfo {
  /** ISO date YYYY-MM-DD — the key for this day. */
  date: string;
  /** Headline, e.g. »Anpfiff in Santa Clara«. */
  title?: string;
  /** One-line description of the day. */
  subtitle?: string;
  /** USPS state codes the day touches, e.g. ["CA","NV"]. */
  states?: string[];
}

export interface Trip {
  meta: TripMeta;
  games: Game[];
  hotels: Hotel[];
  flights: Flight[];
  drives: Drive[];
  activities: Activity[];
  booking: Booking;
  days: DayInfo[];
}

export interface TripPhoto {
  /** Stable slug, e.g. "p-20260613-160124". */
  id: string;
  /** [lat, lon] from photo EXIF GPS. */
  coords: [number, number];
  /** Local wall-clock capture time, "YYYY-MM-DDTHH:MM:SS". */
  time: string;
  /** Public path to the small map-marker thumbnail. */
  thumb: string;
  /** Public path to the full-size (lightbox) image. */
  full: string;
  /** Full-image pixel width / height (post-resize). */
  w: number;
  h: number;
  /** Hand-written caption (edited in scripts/photos.manifest.json). */
  caption?: string;
}
