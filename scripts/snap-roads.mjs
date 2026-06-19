/* ------------------------------------------------------------------
   Snap the photo GPS track (scripts/track.json) onto real OSM roads via
   the OSRM routing engine, and record how far we actually drove each day.

   Output: src/data/route-geometry.ts (GENERATED) with
     - ROUTE_GEOMETRY  the road-following polyline (one continuous line)
     - DAILY_KM        [{ date, km }] real driven distance per day
     - TOTAL_KM        sum of DAILY_KM

   We snap day by day. Each day's request starts at the previous day's
   last point, so the morning departure from the hotel is counted in that
   day. Results are cached per day in scripts/snap-cache.json, so re-runs
   (as more photos arrive) only call the network for new / changed days.

   Usage: node scripts/snap-roads.mjs [--force]
   ------------------------------------------------------------------ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const OSRM = "https://router.project-osrm.org/route/v1/driving/";
const OVERVIEW = "full"; // full-resolution road geometry (more accurate curves)
const force = process.argv.includes("--force");
const dir = import.meta.dirname;

const track = JSON.parse(readFileSync(join(dir, "track.json"), "utf8"));
const cacheFile = join(dir, "snap-cache.json");
const cache =
  existsSync(cacheFile) && !force
    ? JSON.parse(readFileSync(cacheFile, "utf8"))
    : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (n) => Math.round(n * 1e5) / 1e5;

// Iterative Douglas-Peucker: drop near-collinear vertices (long straight
// highway runs collapse to a few points) while keeping curves. Keeps the
// full-resolution accuracy where the road actually bends, cuts file size.
function perpDist(p, a, b) {
  const x = p[1], y = p[0], x1 = a[1], y1 = a[0], x2 = b[1], y2 = b[0];
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
function rdp(points, eps) {
  const n = points.length;
  if (n < 3) return points.slice();
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > maxD) (maxD = d), (idx = i);
    }
    if (maxD > eps && idx !== -1) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function haversineKm(a, b) {
  const R = 6371,
    dLat = ((b[0] - a[0]) * Math.PI) / 180,
    dLon = ((b[1] - a[1]) * Math.PI) / 180,
    la1 = (a[0] * Math.PI) / 180,
    la2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Group track points by capture date, preserving order.
const days = [];
for (const p of track) {
  const date = p.t.slice(0, 10);
  if (!days.length || days.at(-1).date !== date) days.push({ date, pts: [] });
  days.at(-1).pts.push(p.c); // [lat, lon]
}

// OSRM /route through waypoints (in order). Returns { km, geom:[[lon,lat]] }.
// Chunks if a day has very many waypoints (demo server limit safety).
async function snap(waypoints) {
  const CHUNK = 90;
  let km = 0;
  let geom = [];
  for (let i = 0; i < waypoints.length - 1; i += CHUNK - 1) {
    const slice = waypoints.slice(i, i + CHUNK);
    if (slice.length < 2) break;
    const coords = slice.map(([lat, lon]) => `${lon},${lat}`).join(";");
    const url = `${OSRM}${coords}?overview=${OVERVIEW}&geometries=geojson`;
    const res = await fetch(url);
    const j = await res.json();
    if (j.code !== "Ok" || !j.routes?.[0]) throw new Error(j.code || "no route");
    km += j.routes[0].distance / 1000;
    const g = j.routes[0].geometry.coordinates;
    geom.push(...(geom.length ? g.slice(1) : g)); // drop shared boundary point
    await sleep(900); // be gentle to the public demo server
  }
  return { km, geom };
}

const dailyKm = [];
const fullGeom = []; // [lon, lat]
let prevLast = null; // previous day's last point, to count the morning leg

for (const { date, pts } of days) {
  const waypoints = prevLast ? [prevLast, ...pts] : pts;
  prevLast = pts.at(-1);
  if (waypoints.length < 2) continue;

  const key = createHash("md5")
    .update(OVERVIEW + JSON.stringify(waypoints))
    .digest("hex")
    .slice(0, 12);

  let snapped = cache[key];
  if (snapped) {
    console.log(`  ${date}: cached  ${snapped.km.toFixed(1)} km`);
  } else {
    try {
      snapped = await snap(waypoints);
      cache[key] = snapped;
      console.log(
        `  ${date}: snapped ${snapped.km.toFixed(1)} km (${snapped.geom.length} pts)`
      );
    } catch (e) {
      // Fallback: straight segments + great-circle distance, so a network
      // hiccup degrades gracefully instead of dropping the day.
      let km = 0;
      for (let i = 1; i < waypoints.length; i++)
        km += haversineKm(waypoints[i - 1], waypoints[i]);
      snapped = { km, geom: waypoints.map(([lat, lon]) => [lon, lat]) };
      console.warn(`  ${date}: OSRM failed (${e.message}) -> straight fallback`);
    }
  }

  dailyKm.push({ date, km: Math.round(snapped.km) });
  fullGeom.push(...(fullGeom.length ? snapped.geom.slice(1) : snapped.geom));
}

writeFileSync(cacheFile, JSON.stringify(cache, null, 1));

// To [lat, lon], rounded, with consecutive duplicates dropped, then
// Douglas-Peucker simplified (~8 m) to keep accuracy without the bulk.
const deduped = [];
for (const [lon, lat] of fullGeom) {
  const c = [round(lat), round(lon)];
  const p = deduped.at(-1);
  if (!p || p[0] !== c[0] || p[1] !== c[1]) deduped.push(c);
}
const geometry = rdp(deduped, 0.00007);

const totalKm = dailyKm.reduce((s, d) => s + d.km, 0);

const out = `/* ============================================================
   WM-Roadtrip 2026 — road-snapped route (GENERATED — do not edit)

   Photo GPS snapped onto real OSM roads via OSRM, plus real driven
   distance per day. Regenerate with:
     node scripts/extract-gps.mjs               # photos -> gps-raw.json
     node scripts/build-track.mjs 0.5 --write   # -> track.ts + track.json
     node scripts/snap-roads.mjs                # -> this file (cached)

   ROUTE_GEOMETRY is the continuous road line. DAILY_KM / TOTAL_KM are
   the actual kilometers driven (road distance), for trip statistics.
   ============================================================ */

import type { Coords } from "./trip.types";

export interface DayDistance {
  /** ISO date YYYY-MM-DD. */
  date: string;
  /** Road kilometers driven that day. */
  km: number;
}

export const ROUTE_GEOMETRY: Coords[] = [
${geometry.map((c) => `  [${c[0]}, ${c[1]}],`).join("\n")}
];

export const DAILY_KM: DayDistance[] = [
${dailyKm.map((d) => `  { date: "${d.date}", km: ${d.km} },`).join("\n")}
];

export const TOTAL_KM = ${totalKm};
`;

writeFileSync(join(dir, "..", "src", "data", "route-geometry.ts"), out);
console.log(
  `\nwrote src/data/route-geometry.ts: ${geometry.length} road points, ` +
    `${dailyKm.length} days, ${totalKm} km total`
);
