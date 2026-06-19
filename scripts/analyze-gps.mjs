import { readFileSync } from "node:fs";
import { join } from "node:path";

const rows = JSON.parse(
  readFileSync(join(import.meta.dirname, "gps-raw.json"), "utf8")
);

// Parse EXIF "YYYY:MM:DD HH:MM:SS" (local wall clock) into sortable parts.
function parseExif(dt) {
  const m = dt && dt.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return {
    iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`,
    date: `${m[1]}-${m[2]}-${m[3]}`,
    epoch: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]),
  };
}

const pts = rows
  .filter((r) => r.lat != null)
  .map((r) => {
    const p = parseExif(r.dateTime);
    return { ...r, ...p };
  })
  .filter((r) => r.epoch != null)
  .sort((a, b) => a.epoch - b.epoch);

console.log("GPS points with local time:", pts.length);
console.log("first:", pts[0].iso, pts[0].lat.toFixed(4), pts[0].lon.toFixed(4));
console.log(
  "last :",
  pts.at(-1).iso,
  pts.at(-1).lat.toFixed(4),
  pts.at(-1).lon.toFixed(4)
);

// Per-day summary: count + bounding box centroid.
const byDay = {};
for (const p of pts) (byDay[p.date] ||= []).push(p);
console.log("\nday        count  latMin..latMax     lonMin..lonMax");
for (const d of Object.keys(byDay).sort()) {
  const a = byDay[d];
  const lat = a.map((x) => x.lat),
    lon = a.map((x) => x.lon);
  console.log(
    d,
    String(a.length).padStart(5),
    `${Math.min(...lat).toFixed(3)}..${Math.max(...lat).toFixed(3)}`,
    `${Math.min(...lon).toFixed(3)}..${Math.max(...lon).toFixed(3)}`
  );
}
