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
      reachedOnFoot: true, // walked from the Sunnyvale motel — no drive line
      result: {
        homeScore: 3,
        awayScore: 1,
        halftime: "1:0",
        goals: [
          { minute: "21", scorer: "Romano Schmid", team: "home", assist: "Xaver Schlager" },
          { minute: "50", scorer: "Ali Olwan", team: "away", assist: "Noor Al Rawabdeh" },
          { minute: "76", scorer: "Yazan Al Arab", team: "home", ownGoal: true },
          { minute: "90+12", scorer: "Marko Arnautović", team: "home", penalty: true },
        ],
      },
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

  // Hotels — confirmed via booking.com
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
      id: "h2",
      name: "Motel 6 Sunnyvale, CA – South",
      city: "Sunnyvale, CA",
      coords: [37.3953, -122.0276],
      checkIn: "2026-06-16",
      checkOut: "2026-06-17",
      photo: "/hotels/motel-6-sunnyvale.jpg",
      notes: "Übernachtung nach Spiel 1 (Levi's Stadium)",
    },
    {
      id: "h3",
      name: "Trump International Hotel Las Vegas",
      city: "Las Vegas, NV",
      coords: [36.1312, -115.1714],
      checkIn: "2026-06-17",
      checkOut: "2026-06-18",
      photo: "/hotels/hotel-vegas.jpg",
      notes: "Eine Nacht · Hubschrauberflug bei Nacht",
    },
    {
      id: "h4",
      name: "Canyon Inn Motel Flagstaff AZ",
      city: "Flagstaff, AZ",
      coords: [35.1957, -111.6424],
      checkIn: "2026-06-18",
      checkOut: "2026-06-19",
      photo: "/hotels/hotel-flagstaff.jpg",
      notes: "Roadtrip-Stopp · Tor zum Grand Canyon",
    },
    {
      id: "h5",
      name: "Motel 6 Santa Fe",
      city: "Santa Fe, NM",
      coords: [35.6601, -105.9897],
      checkIn: "2026-06-19",
      checkOut: "2026-06-20",
      photo: "/hotels/hotel-santa-fe.jpg",
      notes: "Roadtrip-Stopp",
    },
    {
      id: "h5b",
      name: "La Quinta Inn by Wyndham Amarillo Mid-City",
      city: "Amarillo, TX",
      coords: [35.1922, -101.8042],
      checkIn: "2026-06-20",
      checkOut: "2026-06-21",
      notes: "Zwischenstopp auf der langen Etappe Santa Fe → Dallas",
    },
    {
      id: "h6",
      name: "Comfort Inn Dallas Park Central",
      city: "Dallas, TX",
      coords: [32.9254, -96.7713],
      checkIn: "2026-06-21",
      checkOut: "2026-06-24",
      photo: "/hotels/comfort-inn-dallas.jpg",
      notes: "Spieltag Argentinien vs Österreich (AT&T Stadium)",
    },
    {
      id: "h7",
      name: "Baymont by Wyndham Topeka",
      city: "Topeka, KS",
      coords: [39.004, -95.69],
      checkIn: "2026-06-26",
      checkOut: "2026-06-28",
      photo: "/hotels/hotel-topeka.jpg",
      notes: "Basis für Spiel 3 in Kansas City (~90 km)",
    },
    {
      id: "h8",
      name: "Super 8 by Wyndham Grapevine / DFW Airport Northwest",
      city: "Grapevine, TX",
      coords: [32.9344, -97.078],
      checkIn: "2026-06-28",
      checkOut: "2026-06-29",
      photo: "/hotels/hotel-grapevine.jpg",
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

  // Drives between consecutive booked hotels.
  // The Dallas → Topeka etappe still spans an unbooked overnight —
  // split as needed once that booking is confirmed.
  // `afterGame: true` marks the post-match drive from stadium → night's hotel.
  drives: [
    { id: "d1", date: "2026-06-16", from: "San Francisco, CA", to: "Sunnyvale, CA", km: 70, hrs: 1 },
    { id: "d2", date: "2026-06-17", from: "Sunnyvale, CA", to: "Las Vegas, NV", km: 900, hrs: 9 },
    { id: "d3", date: "2026-06-18", from: "Las Vegas, NV", to: "Flagstaff, AZ", km: 410, hrs: 4 },
    { id: "d4", date: "2026-06-19", from: "Flagstaff, AZ", to: "Santa Fe, NM", km: 580, hrs: 6 },
    { id: "d5", date: "2026-06-20", from: "Santa Fe, NM", to: "Amarillo, TX", km: 450, hrs: 4.5 },
    { id: "d5b", date: "2026-06-21", from: "Amarillo, TX", to: "Dallas, TX", km: 580, hrs: 6 },
    { id: "d6", date: "2026-06-24", from: "Dallas, TX", to: "Topeka, KS", km: 790, hrs: 7.5 },
    { id: "d7", date: "2026-06-28", from: "Topeka, KS", to: "Grapevine, TX", km: 870, hrs: 8.5 },
    // Post-match drives: stadium → night's hotel (road distance)
    { id: "d8", date: "2026-06-16", from: "Levi's Stadium, Santa Clara, CA", to: "Motel 6 Sunnyvale, CA", km: 8, hrs: 0.25, afterGame: true },
    { id: "d9", date: "2026-06-22", from: "AT&T Stadium, Arlington, TX", to: "Comfort Inn Dallas Park Central", km: 45, hrs: 0.7, afterGame: true },
    { id: "d10", date: "2026-06-27", from: "Arrowhead Stadium, Kansas City, MO", to: "Baymont Topeka, KS", km: 115, hrs: 1.25, afterGame: true },
  ],

  // One-off experiences and bookings that aren't hotels, flights, or drives.
  activities: [
    {
      id: "a1",
      date: "2026-06-17",
      time: "23:00",
      title: "Hubschrauberflug bei Nacht über den Las Vegas Strip",
      city: "Las Vegas, NV",
      photo: "/activities/heli-vegas-strip.jpg",
    },
  ],

  // Per-day editorial content. Titles/subtitles are drafts to edit freely.
  // `states` = USPS codes the day touches (see src/data/states.ts).
  days: [
    { date: "2026-06-12", title: "Anreise über den großen Teich", subtitle: "Wien → Frankfurt → Las Vegas → San Francisco", states: ["CA"] },
    { date: "2026-06-13", title: "San Francisco entdecken", subtitle: "Erster voller Tag in der Bay Area", states: ["CA"] },
    { date: "2026-06-14", title: "Alcatraz — Die Gefängnisinsel", subtitle: "Mit der Fähre raus auf »The Rock«", states: ["CA"], hero: "p-20260614-200425" },
    { date: "2026-06-15", title: "Rüber nach Oakland", subtitle: "Letzter Tag vor dem Anpfiff", states: ["CA"] },
    { date: "2026-06-16", title: "Anpfiff in Santa Clara", subtitle: "Österreich – Jordanien · Levi's Stadium", states: ["CA"], hero: "p-20260617-035102" },
    { date: "2026-06-17", title: "Über die Wüste nach Vegas", subtitle: "Nachts im Helikopter über dem Strip", states: ["CA", "NV"] },
    { date: "2026-06-18", title: "Hoover Dam & Route 66", subtitle: "Hinauf in die Berge nach Flagstaff", states: ["NV", "AZ"], hero: "p-20260618-192623" },
    { date: "2026-06-19", title: "Auf der Route 66 nach Santa Fe", subtitle: "Wüstenhighways nach New Mexico", states: ["AZ", "NM"] },
    { date: "2026-06-20", title: "Is This the Way to Amarillo?", subtitle: "Santa Fe → Amarillo", states: ["NM", "TX"] },
    { date: "2026-06-21", title: "Ankommen in Dallas", subtitle: "Amarillo → Dallas · Basislager für Spiel 2", states: ["TX"] },
    { date: "2026-06-22", title: "Österreich gegen Messi & Co.", subtitle: "Argentinien – Österreich · AT&T Stadium", states: ["TX"] },
    { date: "2026-06-23", title: "Verschnaufen in Dallas", subtitle: "Ruhetag in Texas", states: ["TX"] },
    { date: "2026-06-24", title: "Quer durch die Great Plains", subtitle: "Dallas → Topeka", states: ["TX", "OK", "KS"] },
    { date: "2026-06-25", title: "Unterwegs in Kansas", subtitle: "Etappe noch offen", states: ["KS"] },
    { date: "2026-06-26", title: "Basislager Topeka", subtitle: "Vor dem letzten Gruppenspiel", states: ["KS"] },
    { date: "2026-06-27", title: "Finale in Kansas City", subtitle: "Algerien – Österreich · Arrowhead Stadium", states: ["KS", "MO"] },
    { date: "2026-06-28", title: "Letzte Etappe nach Texas", subtitle: "Topeka → Grapevine (DFW)", states: ["KS", "OK", "TX"] },
    { date: "2026-06-29", title: "Heimreise", subtitle: "Dallas → Houston → Toronto → Wien", states: ["TX"] },
    { date: "2026-06-30", title: "Ankunft in Wien", subtitle: "Zurück in Österreich" },
  ],
};
