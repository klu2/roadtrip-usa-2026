/* ------------------------------------------------------------------
   One-off: extract GPS + capture time from road-trip photos.
   Pure-JS JPEG/EXIF reader (no deps). Outputs scripts/gps-raw.json.
   Usage: node scripts/extract-gps.mjs "<photo dir>"
   ------------------------------------------------------------------ */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] || "C:\\Users\\KlausLehner\\Pictures\\USA-Roadtrip";

function readEXIF(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let off = 2;
  // Walk JPEG marker segments to find APP1/Exif.
  while (off + 4 <= buf.length) {
    if (buf[off] !== 0xff) break;
    const marker = buf[off + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS (image data)
    const len = buf.readUInt16BE(off + 2);
    if (marker === 0xe1) {
      const seg = buf.subarray(off + 4, off + 2 + len);
      if (seg.subarray(0, 6).toString("latin1") === "Exif\0\0") {
        return parseTIFF(seg.subarray(6));
      }
    }
    off += 2 + len;
  }
  return null;
}

function parseTIFF(tiff) {
  const bo = tiff.subarray(0, 2).toString("latin1");
  const le = bo === "II";
  if (!le && bo !== "MM") return null;
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));

  function ifd(start) {
    const out = {};
    const n = u16(start);
    for (let i = 0; i < n; i++) {
      const e = start + 2 + i * 12;
      const tag = u16(e);
      const type = u16(e + 2);
      const count = u32(e + 4);
      out[tag] = { type, count, valOff: e + 8 };
    }
    return out;
  }

  // type sizes: 1=byte 2=ascii 3=short 4=long 5=rational 7=undefined 10=srational
  const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

  function valuePtr(ent) {
    const bytes = typeSize[ent.type] * ent.count;
    return bytes <= 4 ? ent.valOff : u32(ent.valOff);
  }

  function rationals(ent) {
    const p = valuePtr(ent);
    const r = [];
    for (let i = 0; i < ent.count; i++) {
      const num = u32(p + i * 8);
      const den = u32(p + i * 8 + 4);
      r.push(den === 0 ? 0 : num / den);
    }
    return r;
  }

  function ascii(ent) {
    const p = valuePtr(ent);
    return tiff.subarray(p, p + ent.count).toString("latin1").replace(/\0+$/, "");
  }

  const ifd0 = ifd(u32(4));

  // DateTimeOriginal lives in the Exif sub-IFD (0x8769), tag 0x9003.
  let dateTime = null;
  if (ifd0[0x8769]) {
    const exif = ifd(u32(ifd0[0x8769].valOff));
    if (exif[0x9003]) dateTime = ascii(exif[0x9003]);
    else if (exif[0x9004]) dateTime = ascii(exif[0x9004]);
  }
  if (!dateTime && ifd0[0x0132]) dateTime = ascii(ifd0[0x0132]);

  // GPS sub-IFD (0x8825).
  if (!ifd0[0x8825]) return { lat: null, lon: null, dateTime };
  const gps = ifd(u32(ifd0[0x8825].valOff));
  if (!gps[2] || !gps[4]) return { lat: null, lon: null, dateTime };

  const latRef = gps[1] ? ascii(gps[1]) : "N";
  const lonRef = gps[3] ? ascii(gps[3]) : "E";
  const [d1, m1, s1] = rationals(gps[2]);
  const [d2, m2, s2] = rationals(gps[4]);
  let lat = d1 + m1 / 60 + s1 / 3600;
  let lon = d2 + m2 / 60 + s2 / 3600;
  if (latRef === "S") lat = -lat;
  if (lonRef === "W") lon = -lon;
  return { lat, lon, dateTime };
}

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
