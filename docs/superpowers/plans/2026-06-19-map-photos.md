# Map Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed curated GPS-positioned road-trip photos on the Leaflet map as clustered thumbnail markers that open a fullscreen, scroll-through gallery lightbox.

**Architecture:** A `sharp`-based Node script reads each photo's EXIF GPS/time, writes resized (metadata-stripped) images to `public/photos/`, maintains a hand-editable manifest JSON (caption source of truth), and regenerates `src/data/photos.ts`. The map adds a `leaflet.markercluster` group of thumbnail `divIcon` markers; clicking one dispatches a `lightbox:open` window event. The existing custom `Lightbox.tsx` is generalized into a gallery (slides + index, prev/next, keyboard, swipe, caption) that listens for that event.

**Tech Stack:** Next.js 15 (App Router) / React 19 / TypeScript, Leaflet 1.9 + leaflet.markercluster, sharp (Node script), plain CSS.

## Global Constraints

- **Verification = `npm run build`.** No test suite/framework exists; do not add one. Each task verifies via the script output, `npm run build` (type + SSR check), and dev visual checks.
- UI is **German only**; user-facing strings in German (`Schließen`, `Zurück`, `Weiter`).
- Plain CSS in `src/app/globals.css` — no Tailwind, no CSS modules.
- Design tokens: `--rot` (#ED2939), `--weiss`, `--ink`, `--font-display` (Archivo Black), `--font-mono` (JetBrains Mono). Reuse them; do not hardcode palette.
- Generated files (`src/data/photos.ts`) carry a "GENERATED — do not hand-edit" header. Captions are edited only in `scripts/photos.manifest.json`.
- Date strings are local wall-clock, no timezone: `"YYYY-MM-DDTHH:MM:SS"`.
- Public images must NOT contain GPS EXIF (sharp strips metadata by default; bake orientation with `.rotate()`).
- Photo source dir: `C:\Users\KlausLehner\Pictures\USA-Roadtrip`.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## File Structure

- `scripts/exif-reader.mjs` — **new.** Shared, dependency-free JPEG/EXIF reader (`readEXIF`). Extracted from `extract-gps.mjs`.
- `scripts/extract-gps.mjs` — **modify.** Import from `exif-reader.mjs` instead of inlining.
- `scripts/process-photos.mjs` — **new.** The photo-processing CLI.
- `scripts/photos.manifest.json` — **generated/maintained** by the script; hand-edited for captions.
- `scripts/README.md` — **modify.** Add an "Embedding photos" section.
- `public/photos/*.jpg` — **generated** output images.
- `src/data/trip.types.ts` — **modify.** Add `TripPhoto` interface.
- `src/data/photos.ts` — **generated** from the manifest.
- `src/components/Lightbox.tsx` — **modify.** Generalize single-image → gallery.
- `src/app/globals.css` — **modify.** Add gallery-nav, photo-pin, photo-cluster styles.
- `src/components/Map.tsx` — **modify.** Add clustered photo markers + click→event.
- `src/app/layout.tsx` — **modify.** Import markercluster base CSS.
- `package.json` — **modify.** Add `leaflet.markercluster`, `@types/leaflet.markercluster`, `sharp` (dev).

---

### Task 1: Shared EXIF reader

Pure refactor: lift the EXIF reader out of `extract-gps.mjs` so `process-photos.mjs` can reuse it, with zero behavior change to the GPS-track pipeline.

**Files:**
- Create: `scripts/exif-reader.mjs`
- Modify: `scripts/extract-gps.mjs`

**Interfaces:**
- Produces: `export function readEXIF(buf: Buffer): { lat: number|null, lon: number|null, dateTime: string|null } | null` and `export function parseTIFF(tiff: Buffer)`.

- [ ] **Step 1: Create `scripts/exif-reader.mjs`**

Move the `readEXIF` and `parseTIFF` function bodies verbatim from `scripts/extract-gps.mjs` (current lines 11–100) into a new module and export them:

```js
/* ------------------------------------------------------------------
   Shared pure-JS JPEG/EXIF reader (no deps).
   Walks JPEG markers -> APP1/Exif -> TIFF/IFD0 -> GPS sub-IFD.
   Returns { lat, lon, dateTime } (decimal degrees, EXIF local wall-clock).
   ------------------------------------------------------------------ */
export function readEXIF(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let off = 2;
  while (off + 4 <= buf.length) {
    if (buf[off] !== 0xff) break;
    const marker = buf[off + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
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

export function parseTIFF(tiff) {
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
      out[u16(e)] = { type: u16(e + 2), count: u32(e + 4), valOff: e + 8 };
    }
    return out;
  }
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
  let dateTime = null;
  if (ifd0[0x8769]) {
    const exif = ifd(u32(ifd0[0x8769].valOff));
    if (exif[0x9003]) dateTime = ascii(exif[0x9003]);
    else if (exif[0x9004]) dateTime = ascii(exif[0x9004]);
  }
  if (!dateTime && ifd0[0x0132]) dateTime = ascii(ifd0[0x0132]);

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
```

- [ ] **Step 2: Update `scripts/extract-gps.mjs` to import the shared reader**

Replace the two inline function definitions (lines 11–100) with an import at the top, keeping everything else (the `dir` arg, the file loop, `gps-raw.json` write) unchanged:

```js
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readEXIF } from "./exif-reader.mjs";

const dir = process.argv[2] || "C:\\Users\\KlausLehner\\Pictures\\USA-Roadtrip";

// ... (file loop unchanged below — still calls readEXIF(readFileSync(...)))
```

- [ ] **Step 3: Verify the GPS pipeline output is byte-identical**

Run: `node scripts/extract-gps.mjs`
Then: `git diff --stat scripts/gps-raw.json`
Expected: the script prints its `photos: N, with GPS: M` line and `git diff` shows **no change** to `gps-raw.json` (the refactor changed nothing functional).

- [ ] **Step 4: Commit**

```bash
git add scripts/exif-reader.mjs scripts/extract-gps.mjs
git commit -m "Extract shared EXIF reader into scripts/exif-reader.mjs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Dependencies

Add the markercluster runtime + types and declare `sharp` (already present transitively) as a dev dependency the script relies on.

**Files:**
- Modify: `package.json` (+ `package-lock.json` via npm)

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install leaflet.markercluster
npm install -D @types/leaflet.markercluster sharp
```

- [ ] **Step 2: Verify the build still passes (nothing consumes them yet)**

Run: `npm run build`
Expected: build succeeds (`✓ Compiled` / `○ Static`), no type errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add leaflet.markercluster and sharp dependencies

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Photo-processing script + data generation

The data-generation deliverable: the `TripPhoto` type, the script, the four processed photos, the manifest, the generated `photos.ts`, and the README docs.

**Files:**
- Modify: `src/data/trip.types.ts`
- Create: `scripts/process-photos.mjs`
- Generated: `scripts/photos.manifest.json`, `src/data/photos.ts`, `public/photos/*.jpg`
- Modify: `scripts/README.md`

**Interfaces:**
- Consumes: `readEXIF` from `scripts/exif-reader.mjs` (Task 1).
- Produces: `TripPhoto` interface (`src/data/trip.types.ts`); `export const PHOTOS: TripPhoto[]` (`src/data/photos.ts`), sorted by `time` ascending, only entries with non-null `coords`.

- [ ] **Step 1: Add the `TripPhoto` interface to `src/data/trip.types.ts`**

Append:

```ts
export interface TripPhoto {
  /** Stable slug, e.g. "p-20260613-160124249". */
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
```

- [ ] **Step 2: Create `scripts/process-photos.mjs`**

```js
/* ------------------------------------------------------------------
   Embed curated road-trip photos onto the map.
   - reads EXIF GPS + capture time (shared reader)
   - resizes with sharp into public/photos/ (metadata stripped)
   - upserts scripts/photos.manifest.json (captions preserved)
   - regenerates src/data/photos.ts
   Usage: node scripts/process-photos.mjs <filenameToken> [<token> ...]
   Tokens may omit the .jpg suffix; resolved by prefix match.
   ------------------------------------------------------------------ */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { readEXIF } from "./exif-reader.mjs";

const PHOTO_DIR = "C:\\Users\\KlausLehner\\Pictures\\USA-Roadtrip";
const PUBLIC_DIR = join(import.meta.dirname, "..", "public", "photos");
const MANIFEST = join(import.meta.dirname, "photos.manifest.json");
const OUT_TS = join(import.meta.dirname, "..", "src", "data", "photos.ts");

const round6 = (n) => Math.round(n * 1e6) / 1e6;

function resolveFile(token, files) {
  if (files.includes(token)) return token;
  return files.find((f) => /\.jpe?g$/i.test(f) && f.startsWith(token)) || null;
}
function idFromName(f) {
  const m = f.match(/(\d{8})_(\d{6})/);
  return m ? `p-${m[1]}-${m[2]}` : f.replace(/\.[^.]+$/, "").toLowerCase();
}
function isoTime(exifDate, file) {
  const m = exifDate && exifDate.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  const f = file.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  return f ? `${f[1]}-${f[2]}-${f[3]}T${f[4]}:${f[5]}:${f[6]}` : null;
}

const tokens = process.argv.slice(2);
if (!tokens.length) {
  console.error("usage: node scripts/process-photos.mjs <filenameToken> [<token> ...]");
  process.exit(1);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
const files = readdirSync(PHOTO_DIR);

let manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : [];
const byId = new Map(manifest.map((e) => [e.id, e]));

for (const token of tokens) {
  const file = resolveFile(token, files);
  if (!file) { console.warn(`! no file for token: ${token}`); continue; }
  const buf = readFileSync(join(PHOTO_DIR, file));
  let exif = null;
  try { exif = readEXIF(buf); } catch { exif = null; }
  const id = idFromName(file);
  const coords = exif && exif.lat != null ? [round6(exif.lat), round6(exif.lon)] : null;
  if (!coords) console.warn(`! no GPS: ${file} (recorded with coords:null, skipped from map)`);
  const time = isoTime(exif?.dateTime, file);

  // Full image (rotate bakes orientation; metadata stripped by default).
  const { data, info } = await sharp(buf, { failOn: "none" })
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  writeFileSync(join(PUBLIC_DIR, `${id}.jpg`), data);
  await sharp(buf, { failOn: "none" })
    .rotate()
    .resize(200, 200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toFile(join(PUBLIC_DIR, `${id}-thumb.jpg`));

  const prev = byId.get(id);
  byId.set(id, {
    id,
    file,
    coords,
    time,
    thumb: `/photos/${id}-thumb.jpg`,
    full: `/photos/${id}.jpg`,
    w: info.width,
    h: info.height,
    caption: prev?.caption ?? "",
  });
  console.log(`✓ ${file} -> ${id} ${coords ? coords.join(",") : "(no gps)"}`);
}

const merged = [...byId.values()].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
writeFileSync(MANIFEST, JSON.stringify(merged, null, 2));

const placed = merged.filter((e) => e.coords);
const rows = placed
  .map((e) => {
    const cap = e.caption ? `, caption: ${JSON.stringify(e.caption)}` : "";
    return `  { id: ${JSON.stringify(e.id)}, coords: [${e.coords[0]}, ${e.coords[1]}], time: ${JSON.stringify(e.time)}, thumb: ${JSON.stringify(e.thumb)}, full: ${JSON.stringify(e.full)}, w: ${e.w}, h: ${e.h}${cap} },`;
  })
  .join("\n");
writeFileSync(
  OUT_TS,
  `// GENERATED by scripts/process-photos.mjs — do not hand-edit.\n` +
    `// Captions are edited in scripts/photos.manifest.json, then regenerate.\n` +
    `import type { TripPhoto } from "./trip.types";\n\n` +
    `export const PHOTOS: TripPhoto[] = [\n${rows}\n];\n`
);
console.log(`\nphotos.ts: ${placed.length} placed, manifest: ${merged.length} total`);
```

- [ ] **Step 3: Run the script on the first four photos**

Run:
```bash
node scripts/process-photos.mjs PXL_20260613_160124249.MP PXL_20260613_180353838 PXL_20260613_190308327.MP PXL_20260613_200659471
```
Expected: four `✓ … -> p-… <lat>,<lon>` lines and `photos.ts: 4 placed, manifest: 4 total`. If any logs `! no GPS`, note it — that photo is intentionally skipped from the map.

- [ ] **Step 4: Verify outputs exist and carry no GPS EXIF**

Run: `node -e "const f=require('fs').readdirSync('public/photos'); console.log(f)"`
Expected: eight files — `p-*.jpg` and `p-*-thumb.jpg` for each placed photo.

Run: `node -e "import('./scripts/exif-reader.mjs').then(m=>{const b=require('fs').readFileSync('public/photos/'+require('fs').readdirSync('public/photos').find(x=>!x.includes('thumb'))); const e=m.readEXIF(b); console.log('gps:', e&&e.lat)})"`
Expected: `gps: null` (or `gps: undefined`) — confirming GPS metadata was stripped from the public image.

- [ ] **Step 5: Type-check the generated data**

Run: `npm run build`
Expected: build succeeds; `src/data/photos.ts` type-checks against `TripPhoto` (it is imported by the build via TS project references even before Map uses it — if not flagged here it will be in Task 5; either way it must compile).

- [ ] **Step 6: Document the workflow in `scripts/README.md`**

Add a new section after the existing "Regenerating after new photos" section:

```markdown
## Embedding photos on the map (`process-photos.mjs`)

Separate from the route track: a **curated** set of photos shown as thumbnail
markers on the map. Pick the photos you want, then:

​```bash
node scripts/process-photos.mjs PXL_20260613_160124249.MP PXL_20260613_180353838
​```

Tokens may omit the `.jpg` suffix (resolved by prefix). The script:

- reads EXIF GPS + capture time (`exif-reader.mjs`, shared with `extract-gps.mjs`),
- writes `public/photos/<id>.jpg` (≤1600px) + `<id>-thumb.jpg` (≤200px), GPS
  metadata stripped,
- **upserts** `scripts/photos.manifest.json` — the hand-editable source of
  truth. Re-running never overwrites a `caption` you've written there,
- regenerates `src/data/photos.ts` (GENERATED — do not hand-edit).

**Captions:** edit the `caption` field in `scripts/photos.manifest.json`, then
re-run the script (with the same or no new tokens) to regenerate `photos.ts`.

Photos with no GPS are recorded in the manifest with `coords: null` and skipped
from the map until you hand-add coordinates.
```

- [ ] **Step 7: Commit**

```bash
git add src/data/trip.types.ts scripts/process-photos.mjs scripts/photos.manifest.json src/data/photos.ts public/photos scripts/README.md
git commit -m "Add photo-processing script and generate map photo data

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Lightbox gallery

Generalize the existing single-image lightbox into a gallery driven by either inline-image clicks (1 slide) or a `lightbox:open` window event (N slides).

**Files:**
- Modify: `src/components/Lightbox.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `window` `CustomEvent("lightbox:open", { detail: { slides: {src,alt?,caption?}[], index?: number } })` (dispatched by Map in Task 5).
- Produces: the event contract above — Task 5 must dispatch exactly this shape.

- [ ] **Step 1: Read the existing lightbox CSS**

Run: review `src/app/globals.css` around the `.lightbox` / `.lb-close` rules (search for `.lightbox`) so the new controls match the existing overlay (z-index, backdrop, close-button style).

- [ ] **Step 2: Replace `src/components/Lightbox.tsx` with the gallery version**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Slide = { src: string; alt?: string; caption?: string };

const ZOOMABLE_SELECTOR = ".stay-photo, .stadium-photo, .event-photo";

export default function Lightbox() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const open = slides.length > 0;
  const touchX = useRef<number | null>(null);

  const close = () => setSlides([]);

  // Inline image clicks (.stay-photo / .stadium-photo / .event-photo) -> 1 slide.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.tagName !== "IMG") return;
      const img = t as HTMLImageElement;
      if (!img.src || !img.closest(ZOOMABLE_SELECTOR)) return;
      e.preventDefault();
      setSlides([{ src: img.currentSrc || img.src, alt: img.alt || "" }]);
      setIndex(0);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Programmatic gallery open (map photo markers).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as { slides?: Slide[]; index?: number };
      if (!d?.slides?.length) return;
      setSlides(d.slides);
      setIndex(Math.min(Math.max(d.index ?? 0, 0), d.slides.length - 1));
    };
    window.addEventListener("lightbox:open", onOpen as EventListener);
    return () => window.removeEventListener("lightbox:open", onOpen as EventListener);
  }, []);

  // ESC/arrows + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("lightbox-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      else if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("lightbox-open");
    };
  }, [open, slides.length]);

  if (!open) return null;
  const s = slides[index];
  const multi = slides.length > 1;
  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <div
      className="lightbox open"
      role="dialog"
      aria-modal="true"
      aria-label={s.alt || "Bild"}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (multi && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <button type="button" className="lb-close" aria-label="Schließen" onClick={close}>
        ×
      </button>
      {multi && (
        <button type="button" className="lb-nav lb-prev" aria-label="Zurück" onClick={() => go(-1)}>
          ‹
        </button>
      )}
      {multi && (
        <button type="button" className="lb-nav lb-next" aria-label="Weiter" onClick={() => go(1)}>
          ›
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.src} alt={s.alt || ""} />
      {(s.caption || multi) && (
        <div className="lb-caption">
          {s.caption && <span>{s.caption}</span>}
          {multi && <span className="lb-count">{index + 1} / {slides.length}</span>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add gallery control styles to `src/app/globals.css`**

Add next to the existing `.lightbox` / `.lb-close` rules (adjust color tokens to match what's already there):

```css
.lb-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.lb-prev { left: 12px; }
.lb-next { right: 12px; }
.lb-caption {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-family: var(--font-body);
  font-size: 14px;
}
.lb-count {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  opacity: 0.85;
  white-space: nowrap;
}
```

- [ ] **Step 4: Build + manually verify the gallery event**

Run: `npm run build`
Expected: succeeds, no type errors.

Then `npm run dev`, open the home page, and in the browser console run:
```js
window.dispatchEvent(new CustomEvent("lightbox:open", { detail: { slides: [
  { src: "/photos/" + "REPLACE-with-a-real-full-image.jpg", caption: "Test 1" },
  { src: "/photos/" + "REPLACE-with-another.jpg", caption: "Test 2" },
], index: 0 } }));
```
Expected: fullscreen overlay opens, ‹/› arrows + ←/→ keys + swipe move between the two slides, caption + "1 / 2" counter show, × and backdrop close. Also click a stadium/hotel photo and confirm the single-image path still works (no arrows).

- [ ] **Step 5: Commit**

```bash
git add src/components/Lightbox.tsx src/app/globals.css
git commit -m "Generalize lightbox into a gallery (prev/next, keyboard, swipe, caption)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Clustered photo markers on the map

Add the photo markers + cluster group to the map and wire marker clicks to the gallery event.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Map.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `PHOTOS: TripPhoto[]` (Task 3); the `lightbox:open` event contract (Task 4).

- [ ] **Step 1: Import markercluster base CSS in `src/app/layout.tsx`**

Add directly after the existing `import "leaflet/dist/leaflet.css";` line:

```ts
import "leaflet.markercluster/dist/MarkerCluster.css";
```

(Skip `MarkerCluster.Default.css` — the cluster icons use a custom class styled in `globals.css`, not the library defaults.)

- [ ] **Step 2: Import the markercluster plugin + photo data in `src/components/Map.tsx`**

Add to the top-level imports:

```ts
import { PHOTOS } from "@/data/photos";
```

Inside the async IIFE, right after `const L = (await import("leaflet")).default;`, load the plugin for its side-effect (it augments `L`):

```ts
await import("leaflet.markercluster");
```

- [ ] **Step 3: Add the photo cluster group in `src/components/Map.tsx`**

After the car-icon block (around current line 175, before the dev-only debug layer), add:

```ts
// Curated photo markers — framed thumbnails grouped into clusters. Clicking a
// marker opens the global gallery lightbox at that photo (chronological order).
if (PHOTOS.length) {
  const photoSlides = PHOTOS.map((p) => ({
    src: p.full,
    alt: p.caption || "",
    caption: p.caption || "",
  }));
  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 44,
    iconCreateFunction: (c) =>
      L.divIcon({
        className: "photo-cluster",
        html: `<span>${c.getChildCount()}</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
  });
  PHOTOS.forEach((p, i) => {
    const icon = L.divIcon({
      className: "photo-pin",
      html: `<span class="photo-pin__frame"><img src="${p.thumb}" alt="" loading="lazy"/></span>`,
      iconSize: [54, 60],
      iconAnchor: [27, 60],
    });
    const m = L.marker(p.coords, { icon });
    m.on("click", () => {
      window.dispatchEvent(
        new CustomEvent("lightbox:open", { detail: { slides: photoSlides, index: i } })
      );
    });
    cluster.addLayer(m);
  });
  cluster.addTo(map);
}
```

If TypeScript does not resolve `L.markerClusterGroup` despite `@types/leaflet.markercluster`, add `import "leaflet.markercluster";` at the top as a type-side-effect import (in addition to the dynamic one), or cast: `(L as typeof L & { markerClusterGroup: Function })`. Prefer the type import; document whichever was needed.

- [ ] **Step 4: Add photo-pin + cluster styles to `src/app/globals.css`**

Add near the other `*-pin` rules:

```css
.photo-pin { background: transparent; }
.photo-pin__frame {
  display: block;
  width: 48px;
  height: 48px;
  padding: 3px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  position: relative;
}
.photo-pin__frame::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #fff;
}
.photo-pin__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
  display: block;
}
.photo-cluster {
  background: var(--rot);
  color: #fff;
  border: 2px solid #fff;
  border-radius: 50%;
  width: 40px !important;
  height: 40px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: succeeds, no type errors (`PHOTOS` import and `markerClusterGroup` resolve).

- [ ] **Step 6: Dev visual verification**

`npm run dev`, open the page:
- Thumbnails appear at the four photo locations along the route.
- Zooming out collapses nearby thumbnails into a red numbered cluster bubble; clicking a cluster zooms/spiderfies.
- Clicking a thumbnail opens the gallery lightbox at that photo; ‹/› + ←/→ + swipe scroll through all four chronologically; caption (if set) + counter show; × / backdrop close.
- Confirm both the home-page embedded map and the dedicated map page show the markers.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/components/Map.tsx src/app/globals.css
git commit -m "Add clustered photo thumbnail markers opening the gallery lightbox

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Data model `TripPhoto` / `photos.ts` → Task 3. ✓
- Manifest caption-safe pipeline → Task 3 (upsert preserves `caption`). ✓
- `process-photos.mjs` (resolve tokens, GPS+time, sharp resize, strip EXIF, regenerate) → Task 3. ✓
- Shared EXIF reader refactor → Task 1. ✓
- markercluster + thumbnail markers + cluster styling + click→event → Task 5. ✓
- Lightbox → gallery (slides+index, inline 1-slide path, event listener, prev/next, keyboard, swipe, caption) → Task 4. ✓
- Dependencies (markercluster, types, sharp dev) → Task 2. ✓
- layout.tsx CSS import → Task 5 Step 1. ✓
- README "Embedding photos" → Task 3 Step 6. ✓
- Verification = `npm run build` + dev visual → every task. ✓

**Placeholder scan:** The browser-console snippet in Task 4 Step 4 has intentional `REPLACE-with-...` markers — these are real filenames the executor fills from the four generated images (e.g. `p-20260613-160124249.jpg`); not a plan placeholder.

**Type consistency:** `TripPhoto` fields (`id, coords, time, thumb, full, w, h, caption?`) defined in Task 3 Step 1 match the generated rows in Task 3 Step 2 and the consumption in Task 5 Step 3. The `lightbox:open` detail shape `{ slides: {src,alt?,caption?}[], index? }` matches between Task 4 (listener) and Task 5 (dispatch). `readEXIF` signature matches between Task 1 (export) and Task 3 (import). ✓
