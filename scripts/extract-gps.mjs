/* ------------------------------------------------------------------
   One-off: extract GPS + capture time from road-trip photos.
   Pure-JS JPEG/EXIF reader (no deps). Outputs scripts/gps-raw.json.
   Usage: node scripts/extract-gps.mjs "<photo dir>"
   ------------------------------------------------------------------ */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readEXIF } from "./exif-reader.mjs";

const dir = process.argv[2] || "C:\\Users\\KlausLehner\\Pictures\\USA-Roadtrip";

const files = readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f));
const rows = [];
let withGps = 0;
for (const f of files) {
  let r = null;
  try {
    r = readEXIF(readFileSync(join(dir, f)));
  } catch (e) {
    r = null;
  }
  // Derive a fallback timestamp from the Pixel filename (UTC): PXL_YYYYMMDD_HHMMSS...
  const m = f.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  const fileTs = m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
  if (r && r.lat != null) withGps++;
  rows.push({
    file: f,
    lat: r?.lat ?? null,
    lon: r?.lon ?? null,
    dateTime: r?.dateTime ?? null, // EXIF local wall-clock "YYYY:MM:DD HH:MM:SS"
    fileTs, // filename UTC
  });
}

writeFileSync(
  join(import.meta.dirname, "gps-raw.json"),
  JSON.stringify(rows, null, 1)
);
console.log(`photos: ${files.length}, with GPS: ${withGps}`);
