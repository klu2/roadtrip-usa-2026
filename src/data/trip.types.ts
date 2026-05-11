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
}

export interface Booking {
  airline: string;
  confirmation: string;
}

export interface Trip {
  meta: TripMeta;
  games: Game[];
  hotels: Hotel[];
  flights: Flight[];
  drives: Drive[];
  booking: Booking;
}
