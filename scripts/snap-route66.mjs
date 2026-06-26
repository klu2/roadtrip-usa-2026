/* ------------------------------------------------------------------
   Snap historic Route 66 waypoints onto real OSM roads via OSRM.

   Input: src/data/route66.ts (ROUTE_66 hand-picked waypoints)
   Output: src/data/route66-geometry.ts (GENERATED) with
     - ROUTE_66_GEOMETRY  the road-following polyline
     - ROUTE_66_STOPS     city stops (passed through, unchanged)

   Usage: node scripts/snap-route66.mjs [--force]
   ------------------------------------------------------------------ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const OSRM = "https://router.project-osrm.org/route/v1/driving/";
const OVERVIEW = "full"; // full-resolution road geometry
const force = process.argv.includes("--force");
const dir = import.meta.dirname;

// Read the hand-picked Route 66 waypoints from the source file
const sourceCode = readFileSync(join(dir, "..", "src", "data", "route66.ts"), "utf8");
const routeMatch = sourceCode.match(/export const ROUTE_66: [^=]* = \[([\s\S]*?)\];/);
const stopsMatch = sourceCode.match(/export const ROUTE_66_STOPS:[^=]* = \[([\s\S]*?)\];/);

if (!routeMatch || !stopsMatch) {
  console.error("Could not parse ROUTE_66 or ROUTE_66_STOPS from source file");
  process.exit(1);
}

// Parse waypoints by extracting [lat, lon] tuples
const waypoints = [];
const lineMatches = [...routeMatch[1].matchAll(/\[([^,]+),\s*([^\]]+)\]/g)];
for (const m of lineMatches) {
  waypoints.push([parseFloat(m[1]), parseFloat(m[2])]);
}

// Parse stops (keep as-is, not snapped to road)
const stops = [];
const stopMatches = [...stopsMatch[1].matchAll(/\{\s*c:\s*\[([^,]+),\s*([^\]]+)\][^}]*label:\s*"([^"]*)"/g)];
for (const m of stopMatches) {
  stops.push({
    c: [parseFloat(m[1]), parseFloat(m[2])],
    label: m[3],
  });
}

console.log(`Loaded ${waypoints.length} Route 66 waypoints and ${stops.length} city stops`);

const cacheFile = join(dir, "snap-route66-cache.json");
const cache = existsSync(cacheFile) && !force ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (n) => Math.round(n * 1e5) / 1e5;

// Douglas-Peucker: simplify while preserving curves
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

// OSRM /route through waypoints (in order). Returns { geom:[[lon,lat]] }.
async function snap(pts) {
  const CHUNK = 90;
  let geom = [];
  for (let i = 0; i < pts.length - 1; i += CHUNK - 1) {
    const slice = pts.slice(i, i + CHUNK);
    if (slice.length < 2) break;
    const coords = slice.map(([lat, lon]) => `${lon},${lat}`).join(";");
    const url = `${OSRM}${coords}?overview=${OVERVIEW}&geometries=geojson`;
    console.log(`  Snapping chunk: ${coords}`);
    const res = await fetch(url);
    const j = await res.json();
    if (j.code !== "Ok" || !j.routes?.[0]) {
      throw new Error(j.code || "no route");
    }
    const g = j.routes[0].geometry.coordinates;
    geom.push(...(geom.length ? g.slice(1) : g)); // drop shared boundary point
    await sleep(900); // be gentle to the public demo server
  }
  return { geom };
}

// Create cache key from waypoints
const key = createHash("md5")
  .update(OVERVIEW + JSON.stringify(waypoints))
  .digest("hex")
  .slice(0, 12);

let snapped;
if (cache[key]) {
  console.log(`Using cached result (${cache[key].geom.length} points)`);
  snapped = cache[key];
} else {
  try {
    console.log("Snapping Route 66 to roads via OSRM...");
    snapped = await snap(waypoints);
    cache[key] = snapped;
    console.log(`Snapped: ${snapped.geom.length} points`);
  } catch (e) {
    console.error(`OSRM failed: ${e.message}`);
    process.exit(1);
  }
}

writeFileSync(cacheFile, JSON.stringify(cache, null, 1));

// Convert to [lat, lon], dedupe, and simplify
const deduped = [];
for (const [lon, lat] of snapped.geom) {
  const c = [round(lat), round(lon)];
  const p = deduped.at(-1);
  if (!p || p[0] !== c[0] || p[1] !== c[1]) deduped.push(c);
}
const geometry = rdp(deduped, 0.00007);

const out = `/* ============================================================
   Historic Route 66 — road-snapped (GENERATED — do not edit)

   Waypoints snapped onto real OSM roads via OSRM. Regenerate with:
     node scripts/snap-route66.mjs

   ROUTE_66_GEOMETRY is the continuous road line.
   ROUTE_66_STOPS are city labels (kept as hand-picked coords).
   ============================================================ */

import type { Coords } from "./trip.types";

export const ROUTE_66_GEOMETRY: Coords[] = [
${geometry.map((c) => `  [${c[0]}, ${c[1]}],`).join("\n")}
];

export const ROUTE_66_STOPS: { c: Coords; label: string }[] = [
${stops.map((s) => `  { c: [${s.c[0]}, ${s.c[1]}], label: "${s.label}" },`).join("\n")}
];
`;

writeFileSync(join(dir, "..", "src", "data", "route66-geometry.ts"), out);
console.log(`Wrote src/data/route66-geometry.ts: ${geometry.length} road points`);
