---
name: process-roadtrip-photos
description: Process and map photos from the road trip — extract GPS, build track, snap to roads, add photos to map
---

# Process Roadtrip Photos

When you have new photo filenames from the road trip (e.g., from a road day), run this workflow to:
1. Extract GPS coordinates from all photos
2. Build the route track (thinned and ordered by date)
3. Snap the track to real OSM roads (via OSRM)
4. Add the specified photos as curated map markers
5. Verify the build

**Always use Haiku model for this task.**

## Input

User provides photo filenames like:
```
process photos PXL_20260622_151415510.MP, PXL_20260622_151115196.TS-000.MP, ...
```

Extract the filenames and proceed.

## Workflow

### Step 1: Extract GPS from all photos
```bash
node scripts/extract-gps.mjs
```
This scans `C:\Users\KlausLehner\Pictures\USA-Roadtrip` and updates `scripts/gps-raw.json` with GPS coordinates from photo EXIF.

### Step 2: Build the track
```bash
node scripts/build-track.mjs 0.5 --write
```
This generates `src/data/track.ts` and `scripts/track.json` — the ordered, thinned route (90 points = clustered GPS from open road, not from stops).

**Read `scripts/build-track.mjs` first if changes are needed:**
- `START_DATE` — when the road trip began
- `SEED` — manual waypoints for legs with no photos (airports, hotel arrivals)
- `EXCLUDE` — time windows where you were on foot/transit (not driving), so those GPS points are dropped as noise
- `minKm` — minimum spacing between kept points (default 0.5 km)

### Step 3: Snap to roads
```bash
node scripts/snap-roads.mjs
```
This routes the track day-by-day through OSRM, snapping it onto real OSM roads. Generates `src/data/route-geometry.ts` with `ROUTE_GEOMETRY` (the road-snapped polyline), `DAILY_KM` (kilometers per day), and `TOTAL_KM`.

**Note:** The map draws two layers:
- **Solid line** = `ROUTE_GEOMETRY` (already driven)
- **Dashed line** = upcoming hotels/games (no GPS yet)

### Step 4: Add photos to the map
```bash
node scripts/process-photos.mjs <filenames...>
```
For each filename:
- Read EXIF GPS + capture time
- Resize to 1600px (full) and 200px (thumb), strip GPS metadata
- Write to `public/photos/`
- Upsert `scripts/photos.manifest.json` (preserves hand-written captions)
- Regenerate `src/data/photos.ts`

**Example:**
```bash
node scripts/process-photos.mjs PXL_20260622_151415510.MP PXL_20260622_151115196.TS-000.MP
```

Filenames can omit `.jpg` suffix (resolved by prefix).

### Step 5: Verify the build
```bash
npm run build
```
Type-checks and SSR-renders all pages. Confirms no errors in the generated data files.

## Common adjustments

If the route looks wrong after re-running steps 1–3, the fix is almost always a tunable in `scripts/build-track.mjs`:

- **Straight line where a leg has no photos** → add a `SEED` point (manual waypoint, e.g., airport, hotel arrival)
- **Route wanders around a stop/stadium** → add an `EXCLUDE` window for the on-foot period
- **Track is too jagged / too sparse** → adjust `minKm` spacing (0.5 is tight, 1.5+ is sparse)
- **New excursion stadium** → set `reach: "foot"` / `"transit"` / `"car"` on that game in `src/data/trip.ts`

## Notes

- `gps-raw.json` is committed, so the track can be rebuilt without photos (not in repo)
- Photos folder: `C:\Users\KlausLehner\Pictures\USA-Roadtrip` (not in repo)
- `OSRM snap-roads` is cached per-day in `scripts/snap-cache.json` — new days call the network, old days reuse cached results
- To force a fresh OSRM snap (ignore cache): `node scripts/snap-roads.mjs --force`
- Photos on the map are **curated** (you choose which ones). Route track is **automatic** (all GPS from all photos, minus EXCLUDE windows).

## When to use

- After a road day with new photos
- To update the map with the latest driving progress
- To add curated photo markers from a specific day
