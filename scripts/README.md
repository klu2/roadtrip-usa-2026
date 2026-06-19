# Route track generation (`scripts/`)

How the map's route polyline gets bent onto the **real roads we drove**,
instead of drawing straight lines between hotels and stadiums. The shape
comes from GPS in the EXIF of photos taken on the road.

## Pipeline

```
photos (C:\Users\KlausLehner\Pictures\USA-Roadtrip)
   │  node scripts/extract-gps.mjs
   ▼
scripts/gps-raw.json        ← raw {file, lat, lon, dateTime, fileTs} per photo
   │  node scripts/build-track.mjs 0.5 --write
   ▼
src/data/track.ts  +  scripts/track.json   ← GENERATED, ordered + thinned track
   │  node scripts/snap-roads.mjs
   ▼
src/data/route-geometry.ts  ← GENERATED: ROUTE_GEOMETRY + DAILY_KM + TOTAL_KM
   │  imported by
   ▼
src/components/Map.tsx       ← solid road line (driven) + dashed line (upcoming)
```

- **`extract-gps.mjs`** — pure-JS JPEG/EXIF reader (no dependencies). Walks
  JPEG marker segments → APP1/Exif → TIFF/IFD0 → GPS sub-IFD, converts the
  deg/min/sec rationals to signed decimal `[lat, lon]`, and grabs
  `DateTimeOriginal` (local wall-clock) plus a UTC timestamp parsed from the
  Pixel filename as a fallback. Writes one row per photo to `gps-raw.json`.
- **`build-track.mjs`** — turns `gps-raw.json` into the ordered, thinned
  track. Run with no `--write` to just print point counts at several spacing
  thresholds; run with `<minKm> --write` to generate `src/data/track.ts`.
- **`snap-roads.mjs`** — snaps the track onto real OSM roads via the public
  OSRM routing engine and records how far we actually drove. It routes **day
  by day** (each day starts at the previous day's last point, so the morning
  departure counts toward that day), summing OSRM's road distance per day.
  Output `src/data/route-geometry.ts` exports `ROUTE_GEOMETRY` (the continuous
  road polyline), `DAILY_KM` (`[{date, km}]`), and `TOTAL_KM`. Per-day results
  are cached in `scripts/snap-cache.json`, so re-runs only hit the network for
  new / changed days — pass `--force` to ignore the cache. If OSRM is
  unreachable for a day it falls back to straight segments + great-circle km
  and logs a warning (no silent gaps).
- **`analyze-gps.mjs`** — ad-hoc inspection: per-day point counts and
  bounding boxes. Handy for spotting which day a cluster belongs to.

## The rules (all live in `build-track.mjs`)

1. **`START_DATE`** (`2026-06-16`) — the road trip began when we picked up
   the rental car the morning of the first match. Everything before that was
   on foot / transit in San Francisco, so those photos are dropped.
2. **`SEED`** — manual waypoints injected into the track. Used when a real
   leg has no usable photo. Currently one: **SFO**, where the trip actually
   started (coords taken from an arrival-day airport photo, timestamped at
   the morning pickup so it sorts first). Add more here for any leg the
   photos miss.
3. **`EXCLUDE`** — time windows to drop entirely, for GPS captured while we
   were **not driving** (so the route doesn't wander). E.g. June 16 after
   ~13:50 we'd reached the Sunnyvale motel and walked to Levi's — those
   stadium points are noise, not a drive.
4. **Min-spacing thinning** (`minKm`, default arg `0.5`) — a point is kept
   only if it's ≥ `minKm` from the last kept point. This collapses clusters
   (many shots at one viewpoint / stop) to a single point while preserving
   the open-road shape. The kept points are **invisible** on the map; they
   only shape the line.

## How the map consumes it (`Map.tsx`)

The route is drawn in **two layers**:

- **Driven** — `ROUTE_GEOMETRY` from `route-geometry.ts`, the road-snapped
  line of everything we've already driven. Drawn **solid**.
- **Upcoming** — the hotels/games whose time is *after* the last photo, with
  no GPS yet, connected in chronological order (hotels sort at `22:00` on
  check-in, games at kickoff) and continuing from where the driven line ends.
  Drawn **dashed**.

A **car icon** marks the start (the first track point — SFO).

Two things get a **marker but no line** (skipped when building either line,
not when placing markers):

- **Hotels with `checkIn` before `ROADTRIP_START`** — the pre-trip SF base.
- **Games with `reachedOnFoot: true`** (set in `src/data/trip.ts`) — e.g.
  Levi's, which we walked to from the motel.

`DAILY_KM` / `TOTAL_KM` from the same file are the real driven kilometers,
available for a stats section (not yet rendered).

## Regenerating after new photos

On the road we keep taking photos, **and the rest of the trip's legs get built
out as we go**, so after copying new photos into the photo folder run all
three stages:

```bash
node scripts/extract-gps.mjs              # photos      -> gps-raw.json
node scripts/build-track.mjs 0.5 --write  # gps-raw.json -> track.ts + track.json
node scripts/snap-roads.mjs               # track.json  -> route-geometry.ts (cached)
npm run build                             # type-check / SSR sanity
```

As new days are added they appear automatically: the driven (solid) line
extends, the dashed line shrinks to the still-upcoming legs, and `DAILY_KM`
gains a row. Only the new/changed days call OSRM (the rest are cached).

When a new leg looks wrong, the fix is almost always a tunable above:

- straight line where a leg has no photos → add a **`SEED`** point;
- route wandering around a stop/stadium → add an **`EXCLUDE`** window for
  the on-foot period;
- too jagged / too sparse → change the **`minKm`** spacing;
- new walked-to stadium → set **`reachedOnFoot`** on that game in `trip.ts`.

`gps-raw.json` is committed as a cache so the track can be rebuilt without
the photos (which are not in the repo) — but a fresh `extract-gps.mjs` run is
what picks up newly added photos.

## Embedding photos on the map (`process-photos.mjs`)

Separate from the route track: a **curated** set of photos shown as thumbnail
markers on the map. Pick the photos you want, then:

```bash
node scripts/process-photos.mjs PXL_20260613_160124249.MP PXL_20260613_180353838
```

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
