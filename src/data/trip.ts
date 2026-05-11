/* ============================================================
   WM-Roadtrip 2026 — Trip Data
   Single source of truth. Edit this file to update games,
   hotels, flights, drives. Dates are ISO (YYYY-MM-DD).
   Coords are [lat, lon]. Types live in ./trip.types.ts.
   ============================================================ */

import type { Trip } from "./trip.types";

export const TRIP: Trip = {
  meta: {
    title: "WM-Roadtrip 2026",
    subtitle: "Mit Österreich unterwegs — 4 Mann, 3 Spiele, 19 Tage",
    start: "2026-06-12",
    end: "2026-06-30",
    crew: ["Markus Klauser", "Anton Bayer", "Markus Datzberger", "Klaus Lehner"],
  },

  // Austria's three group-stage matches (Group J)
  games: [
    {
      id: "g1",
      date: "2026-06-16",
      kickoff: "21:00 PT",
      kickoffVie: "06:00 (17. Juni)",
      home: "Österreich",
      homeFlag: "at",
      away: "Jordanien",
      awayFlag: "jo",
      stadium: "Levi's Stadium",
      stadiumPhoto: "/stadiums/levis-stadium.jpg",
      city: "Santa Clara, CA",
      coords: [37.403, -121.97],
      tournamentName: "San Francisco Bay Area Stadium",
      capacity: 68500,
    },
    {
      id: "g2",
      date: "2026-06-22",
      kickoff: "12:00 CT",
      kickoffVie: "19:00",
      home: "Argentinien",
      homeFlag: "ar",
      away: "Österreich",
      awayFlag: "at",
      stadium: "AT&T Stadium",
      stadiumPhoto: "/stadiums/att-stadium.jpg",
      city: "Arlington, TX",
      coords: [32.7473, -97.0945],
      tournamentName: "Dallas Stadium",
      capacity: 80000,
    },
    {
      id: "g3",
      date: "2026-06-27",
      kickoff: "21:00 CT",
      kickoffVie: "04:00 (28. Juni)",
      home: "Algerien",
      homeFlag: "dz",
      away: "Österreich",
      awayFlag: "at",
      stadium: "Arrowhead Stadium",
      stadiumPhoto: "/stadiums/arrowhead-stadium.jpg",
      city: "Kansas City, MO",
      coords: [39.0489, -94.4839],
      tournamentName: "Kansas City Stadium",
      capacity: 76416,
    },
  ],

  hotels: [
    {
      id: "h1",
      name: "Motel 6 San Francisco – Great Highway",
      city: "San Francisco, CA",
      coords: [37.7630853, -122.5121131],
      checkIn: "2026-06-12",
      checkOut: "2026-06-16",
      photo: "/hotels/hotel-sf.png",
      notes: "Ankunft + Vor-Spiel-Tage, Check-out am Spieltag",
    },
    {
      id: "h3",
      name: "Trump International Hotel Las Vegas",
      city: "Las Vegas, NV",
      coords: [36.1312, -115.1714],
      checkIn: "2026-06-17",
      checkOut: "2026-06-18",
      photo: "/hotels/hotel-vegas.jpg",
      notes: "Eine Nacht",
    },
    {
      id: "h4",
      name: "Hotel TBD — Grand Canyon",
      city: "Grand Canyon, AZ",
      coords: [36.0544, -112.1401],
      checkIn: "2026-06-19",
      checkOut: "2026-06-20",
      notes: "Roadtrip-Stopp",
    },
    {
      id: "h5",
      name: "Hotel TBD — Dallas",
      city: "Dallas, TX",
      coords: [32.7767, -96.797],
      checkIn: "2026-06-20",
      checkOut: "2026-06-23",
      notes: "Spieltag Argentinien vs Österreich",
    },
    {
      id: "h6",
      name: "Hotel TBD — Oklahoma City",
      city: "Oklahoma City, OK",
      coords: [35.4676, -97.5164],
      checkIn: "2026-06-23",
      checkOut: "2026-06-24",
      notes: "Roadtrip-Stopp",
    },
    {
      id: "h7",
      name: "Hotel TBD — Kansas City",
      city: "Kansas City, MO",
      coords: [39.0997, -94.5786],
      checkIn: "2026-06-24",
      checkOut: "2026-06-28",
      notes: "Spieltag Algerien vs Österreich",
    },
    {
      id: "h8",
      name: "Hotel TBD — Dallas",
      city: "Dallas, TX",
      coords: [32.7767, -96.797],
      checkIn: "2026-06-28",
      checkOut: "2026-06-29",
      notes: "Abreisebasis (Früh-Flug DFW)",
    },
  ],

  // Flights — confirmed (United, conf. ODJXNY)
  flights: [
    // Outbound: VIE → FRA → LAS → SFO on June 12
    { id: "f1a", date: "2026-06-12", airline: "Austrian Airlines", number: "UA 9861", from: { code: "VIE", city: "Wien" }, to: { code: "FRA", city: "Frankfurt" }, depart: "07:00", arrive: "08:30", duration: "1h 30m", cls: "Economy (K)" },
    { id: "f1b", date: "2026-06-12", airline: "Discover Airlines", number: "UA 9666", from: { code: "FRA", city: "Frankfurt" }, to: { code: "LAS", city: "Las Vegas" }, depart: "13:45", arrive: "16:20", duration: "11h 35m", cls: "Economy (K)" },
    { id: "f1c", date: "2026-06-12", airline: "United Airlines", number: "UA 1603", from: { code: "LAS", city: "Las Vegas" }, to: { code: "SFO", city: "San Francisco" }, depart: "18:20", arrive: "20:02", duration: "1h 42m", cls: "Economy (K)" },
    // Return: DFW → IAH → YYZ → VIE
    { id: "f2a", date: "2026-06-29", airline: "United Airlines", number: "UA 2670", from: { code: "DFW", city: "Dallas" }, to: { code: "IAH", city: "Houston" }, depart: "07:00", arrive: "08:26", duration: "1h 26m", cls: "Economy (T)" },
    { id: "f2b", date: "2026-06-29", airline: "United Airlines", number: "UA 2606", from: { code: "IAH", city: "Houston" }, to: { code: "YYZ", city: "Toronto" }, depart: "10:04", arrive: "14:24", duration: "3h 20m", cls: "Economy (T)" },
    { id: "f2c", date: "2026-06-29", airline: "Air Canada", number: "UA 8492", from: { code: "YYZ", city: "Toronto" }, to: { code: "VIE", city: "Wien" }, depart: "18:00", arrive: "08:20 +1", duration: "8h 20m", cls: "Economy (T)", note: "Ankunft 30. Juni" },
  ],

  booking: { airline: "United Airlines", confirmation: "ODJXNY" },

  drives: [
    { id: "d1", date: "2026-06-17", from: "Santa Clara, CA", to: "Las Vegas, NV", km: 925, hrs: 9 },
    { id: "d2", date: "2026-06-19", from: "Las Vegas, NV", to: "Grand Canyon, AZ", km: 450, hrs: 4.5 },
    { id: "d3", date: "2026-06-20", from: "Grand Canyon, AZ", to: "Dallas, TX", km: 1700, hrs: 16 },
    { id: "d4", date: "2026-06-23", from: "Dallas, TX", to: "Oklahoma City, OK", km: 330, hrs: 3.5 },
    { id: "d5", date: "2026-06-24", from: "Oklahoma City, OK", to: "Kansas City, MO", km: 565, hrs: 5.5 },
    { id: "d6", date: "2026-06-28", from: "Kansas City, MO", to: "Dallas, TX", km: 880, hrs: 8.5 },
  ],
};
