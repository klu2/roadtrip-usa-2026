# Design: GPS-positioned photos on the map

**Date:** 2026-06-19
**Status:** Approved

## Goal

Embed curated road-trip photos onto the Leaflet map at their GPS position. Each
photo shows as a small framed thumbnail marker; clicking opens it fullscreen in a
gallery lightbox you can scroll through (prev/next). Nearby photos collapse into
clusters so the map never floods. Photos are hand-curated (we pick which ones get
embedded), and the batch will grow over time, so processing must be a repeatable
one-command step.

Out of scope (later): rendering these photos per-day on the main page. The data
model below is built so that feature is additive, not a rewrite.

## Decisions

- **Presentation:** framed thumbnail markers, grouped by `leaflet.markercluster`.
- **Fullscreen view:** extend the *existing* custom `Lightbox.tsx` into a gallery
  (zero new lightbox dependency), rather than adding a library. The site already
  has one lightbox governing all other photos; a unified component also serves the
  future per-day diary gallery.
- **Caption safety:** a hand-editable manifest JSON is the source of truth;
  `photos.ts` is generated from it. Re-running the processing script never
  clobbers hand-written captions.

## Architecture

### Data model

`src/data/trip.types.ts` gains:

```ts
export interface TripPhoto {
  id: string;                 // stable slug, e.g. "p-20260613-160124249"
  coords: [number, number];   // [lat, lon]
  time: string;               // local wall-clock "YYYY-MM-DDTHH:MM:SS"
  thumb: string;              // "/photos/<id>-thumb.jpg"
  full: string;               // "/photos/<id>.jpg"
  w: number;                  // original pixel width
  h: number;                  // original pixel height
  caption?: string;           // hand-written, optional
}
```

`src/data/photos.ts` is **generated**, exports `PHOTOS: TripPhoto[]` sorted by
`time` ascending (so gallery prev/next runs chronologically), and imports the
`TripPhoto` type from `trip.types.ts`.

### Pipeline (manifest pattern)

Mirrors the existing `gps-raw.json → track.ts` generation pattern.

```
photos (C:\Users\KlausLehner\Pictures\USA-Roadtrip)
   │  node scripts/process-photos.mjs <token> <token> ...
   ▼
public/photos/<id>.jpg + <id>-thumb.jpg     ← resized, EXIF stripped
scripts/photos.manifest.json                ← hand-editable; captions live here
   │  (same script regenerates)
   ▼
src/data/photos.ts                          ← GENERATED, do not hand-edit
```

- `scripts/photos.manifest.json` is the durable source of truth. The script
  **upserts** entries keyed by `id`: a new photo is appended; an existing entry's
  `caption` is **preserved**. Captions are written by hand in this file.
- `src/data/photos.ts` is regenerated from the manifest on every run.

### Processing script — `scripts/process-photos.mjs`

Invocation (bare filename tokens; resolved to real files by prefix match, so
`PXL_20260613_160124249.MP` finds `PXL_20260613_160124249.MP.jpg`):

```
node scripts/process-photos.mjs PXL_20260613_160124249.MP PXL_20260613_180353838 \
  PXL_20260613_190308327.MP PXL_20260613_200659471
```

Per photo:
1. Read **GPS + capture time** via shared EXIF reader (see refactor below).
2. Resize with **`sharp`** into `public/photos/`:
   - `<id>.jpg` — longest edge ≤ 1600px, JPEG q82.
   - `<id>-thumb.jpg` — longest edge ≤ 200px, JPEG q70.
   - **Metadata stripped** (sharp default) so public images do not leak GPS EXIF.
3. Capture original `w`/`h`.
4. Upsert the manifest entry (preserving any existing `caption`).
5. Regenerate `src/data/photos.ts` from the manifest.

`id` derived from the `YYYYMMDD_HHMMSS` portion of the Pixel filename →
`p-YYYYMMDD-HHMMSS`. `time` from EXIF `DateTimeOriginal` (`YYYY:MM:DD HH:MM:SS` →
`YYYY-MM-DDTHH:MM:SS`), falling back to the filename UTC stamp.

Photos with no GPS: warn and skip from `photos.ts` (entry still recorded in the
manifest with `coords: null` so coordinates can be hand-added later).

### Shared EXIF reader refactor

`readEXIF` / `parseTIFF` currently live inside `scripts/extract-gps.mjs`. Extract
them into `scripts/exif-reader.mjs` (named exports) and have both
`extract-gps.mjs` and `process-photos.mjs` import them. Pure DRY refactor of code
being touched; no behavior change to the existing GPS-track pipeline.

### Map integration — `src/components/Map.tsx`

- Add `leaflet.markercluster` via dynamic import after the existing
  `import("leaflet")`. Its two stylesheets (`MarkerCluster.css`,
  `MarkerCluster.Default.css`) are imported once in `src/app/layout.tsx`, next to
  the existing Leaflet CSS import.
- Build a `markerClusterGroup` holding one marker per `PHOTOS` entry.
- Photo marker = `L.divIcon` (`className: "photo-pin"`) rendering the framed
  **thumbnail** `<img>`, with a bottom pointer; `iconAnchor` at bottom-center.
- Cluster bubbles use a custom `iconCreateFunction` styled in the Austrian palette
  (overriding the library's default blue/green).
- Marker `click` dispatches a `window` `CustomEvent("lightbox:open", { detail: {
  slides, index } })`, where `slides` is all photos mapped to
  `{ src: full, alt, caption }` and `index` is the clicked photo's position.

### Lightbox → gallery — `src/components/Lightbox.tsx`

- Generalize internal state from a single `src`/`alt` to `slides: {src, alt?,
  caption?}[]` plus `index`.
- Existing delegated clicks on `.stay-photo` / `.stadium-photo` / `.event-photo`
  images continue to work, opening as a 1-slide gallery (prev/next hidden).
- New: a `lightbox:open` event listener opens the gallery at `detail.index` with
  `detail.slides`. Adds prev/next buttons, **←/→ keyboard** navigation,
  **touch-swipe** (pointer/touch handlers), and an optional caption bar.
- The imperative Leaflet map communicates with the global React Lightbox **only**
  through the custom event — no prop-drilling across the server/client boundary.
- New CSS for gallery controls (arrows, caption bar) added to `globals.css`
  alongside the existing `.lightbox` / `.lb-close` rules; existing single-image
  styling preserved.

## Dependencies

- Add `leaflet.markercluster` (runtime) + `@types/leaflet.markercluster` (dev).
- Add `sharp` to `devDependencies` (already present transitively; declared now
  because the script depends on it directly).

## Error handling

- Filename token resolves to no file → log and skip that token.
- Photo missing GPS → warn, record in manifest with `coords: null`, skip from map.
- OSRM/track pipeline untouched, so no new failure modes there.
- Lightbox with a single slide hides navigation controls (no broken prev/next).

## Verification

- `npm run build` (type-check + SSR sanity — the project's standard gate).
- Dev visual pass: thumbnails render on the map, cluster on zoom-out, click opens
  the gallery, prev/next + keyboard + swipe + close all work, caption shows.
- Confirm `public/photos/*.jpg` carry no GPS EXIF (metadata stripped).

## Docs

`scripts/README.md` gains an "Embedding photos" section documenting the
`process-photos.mjs` invocation, the manifest/caption workflow, and the generated
files.
