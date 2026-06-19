/* ------------------------------------------------------------------
   Turn extracted photo GPS (scripts/gps-raw.json) into an ordered,
   thinned route track for the map → src/data/track.ts (generated).

   The road trip starts the morning we picked up the car (first match
   day). Everything before that was on foot / transit in SF, so we drop
   it. Points are thinned by minimum spacing: clusters at viewpoints and
   stops collapse to one point, the open-road shape is kept. The points
   are invisible on the map — they only bend the route off straight lines.

   Usage: node scripts/build-track.mjs [minKm] [--write]
   ------------------------------------------------------------------ */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const START_DATE = "2026-06-16"; // car pickup / first match day
const minKm = parseFloat(process.argv[2]) || 1.5;
const write = process.argv.includes("--write");

// Manual seed points. The road trip began at SFO (rental-car pickup) the
// morning of the first match, but the earliest GPS-tagged road photo is
// already at the Golden Gate. Seed the route with the airport so it starts
// in the right place. Coords from PXL_20260613_030808442.jpg (shot at SFO
// on arrival); timestamped at pickup so it sorts before the first photo.
const SEED = [{ iso: "2026-06-16T08:00:00", lat: 37.61730, lon: -122.38365 }];

// Time windows to drop entirely — GPS captured while NOT driving, so it is
// just noise on the route. June 16 ~13:50 we reached the Sunnyvale motel and
// then walked to Levi's for the match; everything after the arrival is on
// foot around the stadium, not the car.
const EXCLUDE = [{ from: "2026-06-16T14:00:00", to: "2026-06-16T23:59:59" }];
const excluded = (iso) => EXCLUDE.some((w) => iso >= w.from && iso <= w.to);

const rows = JSON.parse(
  readFileSync(join(import.meta.dirname, "gps-raw.json"), "utf8")
);

function parseExif(dt) {
  const m = dt && dt.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return {
    iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`,
    date: `${m[1]}-${m[2]}-${m[3]}`,
    epoch: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]),
  };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const pts = rows
  .filter((r) => r.lat != null)
  .map((r) => ({ ...r, ...parseExif(r.dateTime) }))
  .filter((r) => r.epoch != null && r.date >= START_DATE && !excluded(r.iso))
  .sort((a, b) => a.epoch - b.epoch);

// Minimum-spacing thinning: keep a point only if it is at least `minKm`
// from the last point we kept. Always keep the first and last.
function thin(points, km) {
  if (!points.length) return [];
  const kept = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (haversineKm([p.lat, p.lon], [kept.at(-1).lat, kept.at(-1).lon]) >= km)
      kept.push(p);
  }
  if (kept.at(-1) !== points.at(-1)) kept.push(points.at(-1));
  return kept;
}

if (!write) {
  console.log(`road-trip points (>= ${START_DATE}): ${pts.length}`);
  for (const km of [0.5, 1, 1.5, 2, 3, 5]) {
    console.log(`  minKm ${km}: ${thin(pts, km).length} points`);
  }
  console.log("\nrun with `<minKm> --write` to generate src/data/track.ts");
  process.exit(0);
}

const kept = [...SEED, ...thin(pts, minKm)].sort((a, b) =>
  a.iso.localeCompare(b.iso)
);
const round = (n) => Math.round(n * 1e5) / 1e5; // ~1 m precision

const body = kept
  .map((p) => `  { t: "${p.iso}", c: [${round(p.lat)}, ${round(p.lon)}] },`)
  .join("\n");

const out = `/* ============================================================
   WM-Roadtrip 2026 — GPS track (GENERATED — do not edit by hand)

   Source: EXIF GPS from on-the-road photos, thinned to ~${minKm} km
   spacing. Regenerate with:
     node scripts/extract-gps.mjs            # photos -> gps-raw.json
     node scripts/build-track.mjs ${minKm} --write   # -> this file

   Ordered by capture time. These points are invisible on the map;
   they only bend the route polyline onto the real roads we drove.
   ============================================================ */

import type { Coords } from "./trip.types";

export interface TrackPoint {
  /** EXIF local capture time, ISO (no zone). */
  t: string;
  /** [lat, lon]. */
  c: Coords;
}

export const TRACK: TrackPoint[] = [
${body}
];
`;

writeFileSync(join(import.meta.dirname, "..", "src", "data", "track.ts"), out);
console.log(
  `wrote src/data/track.ts: ${kept.length} points (from ${pts.length}, minKm ${minKm})`
);
