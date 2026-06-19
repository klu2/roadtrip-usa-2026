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
src/data/track.ts           ← GENERATED, ordered + thinned TrackPoint[]
   │  imported by
   ▼
src/components/Map.tsx       ← merges track with hotels/games into one route
```

- **`extract-gps.mjs`** — pure-JS JPEG/EXIF reader (no dependencies). Walks
  JPEG marker segments → APP1/Exif → TIFF/IFD0 → GPS sub-IFD, converts the
  deg/min/sec rationals to signed decimal `[lat, lon]`, and grabs
  `DateTimeOriginal` (local wall-clock) plus a UTC timestamp parsed from the
  Pixel filename as a fallback. Writes one row per photo to `gps-raw.json`.
- **`build-track.mjs`** — turns `gps-raw.json` into the ordered, thinned
  track. Run with no `--write` to just print point counts at several spacing
  thresholds; run with `<minKm> --write` to generate `src/data/track.ts`.
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

All route nodes go on **one local-time timeline** and the polyline is drawn
through them in time order:

- **Track points** use their real EXIF capture time.
- **Hotels** sort at `22:00` on their check-in day (so that day's driving
  precedes the night's stay).
- **Games** sort at kickoff (so the night's hotel still comes after the match).

Two things get a **marker but no drive line** (they're skipped when building
the polyline, not when placing markers):

- **Hotels with `checkIn` before `ROADTRIP_START`** — the pre-trip SF base.
  Keeps the pin, but no line is drawn out to it.
- **Games with `reachedOnFoot: true`** (set in `src/data/trip.ts`) — e.g.
  Levi's, which we walked to from the motel. Ball marker stays; no car line.

## Regenerating after new photos

On the road we keep taking photos, so after copying new ones into the photo
folder:

```bash
node scripts/extract-gps.mjs              # photos      -> gps-raw.json
node scripts/build-track.mjs 0.5 --write  # gps-raw.json -> src/data/track.ts
npm run build                             # type-check / SSR sanity
```

When a new leg looks wrong, the fix is almost always a tunable above:

- straight line where a leg has no photos → add a **`SEED`** point;
- route wandering around a stop/stadium → add an **`EXCLUDE`** window for
  the on-foot period;
- too jagged / too sparse → change the **`minKm`** spacing;
- new walked-to stadium → set **`reachedOnFoot`** on that game in `trip.ts`.

`gps-raw.json` is committed as a cache so the track can be rebuilt without
the photos (which are not in the repo) — but a fresh `extract-gps.mjs` run is
what picks up newly added photos.
