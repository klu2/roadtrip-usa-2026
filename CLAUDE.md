# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first Next.js 15 (App Router, TypeScript, React 19) page that documents a four-person Austria FIFA WM 2026 USA roadtrip — three group-stage games, ~19 days, six driving legs, two long-haul flights. UI is **German only** (`<html lang="de">`, all date formatting via the `de` locale). The design was handed off from Claude Design (claude.ai/design); the original prototype lives in `.design-extract/` (gitignored) and is the visual reference, not a code reference.

## Commands

```bash
npm run dev      # Next dev server on http://localhost:3000
npm run build    # Production build (also type-checks; run before claiming work is done)
npm run start    # Serve the production build
```

There is no lint script and no test suite. Verification = `npm run build` (this catches type and SSR errors).

## Architecture

### Single source of truth for trip data

**`src/data/trip.ts`** holds everything dynamic: `meta`, `games`, `hotels`, `flights`, `drives`, `booking`. **Types live separately in `src/data/trip.types.ts`** — keep `trip.ts` pure data, no interface declarations. Hotels mostly have `name: "Hotel TBD — …"` placeholders that get filled in as bookings confirm — **editing `trip.ts` is the primary way to update the site**. Coords are `[lat, lon]` tuples; dates are ISO `YYYY-MM-DD`. A hotel's `checkOut` is the morning of departure, so the last *slept* night is `checkOut - 1` — this matters for badge math (see below).

### Leaflet map, client-only

Leaflet does not SSR. The map is loaded through a two-file dance:

- **`src/components/MapClient.tsx`** — `dynamic(() => import("./Map"), { ssr: false })`. This is what the server-rendered `page.tsx` references.
- **`src/components/Map.tsx`** — `"use client"`, dynamically `import("leaflet")` inside `useEffect` so the package is never touched on the server. Leaflet's CSS is imported once in `src/app/layout.tsx`.

The map renders: hotel markers (red pill divIcons, badge = trip-night number), game markers (soccer-ball SVG divIcons), and a dashed polyline through all stops in date order. Tiles are CARTO Positron (warm/neutral, fits the Austrian-flag palette).

**Fullscreen** is implemented with a React state flag (`full`), not the browser Fullscreen API. When `true`, the map host gets `position: fixed; inset: 0; height: 100dvh` (see `.map-host.full` in globals.css), and `body` gets `overflow: hidden` via the `map-full-active` class. `mapRef.current.invalidateSize()` is called after the toggle so Leaflet re-measures.

### Hotel pin badges = trip-night numbers, not hotel index

`src/lib/format.ts` exposes `stayBadge(checkIn, checkOut, tripStart)`. Night of `tripStart` is night 1. A single-night stay returns `"6"`; a multi-night stay returns a range like `"13-16"`. The map pin is a CSS pill that grows with text length — when changing this, recompute `iconAnchor` based on the badge string length (see `Map.tsx`).

### Styling

Plain CSS in `src/app/globals.css`, no Tailwind, no CSS modules. The design system is locked to:

- **Tokens** — `--rot` (Austria red `#ED2939`), `--weiss` (warm off-white), `--pitch` (green accent for match days), `--ink`. Defined at `:root`.
- **Type** — Archivo Black (display, uppercase), Inter (body), JetBrains Mono (eyebrows, metadata, mono labels). Loaded from Google Fonts in `layout.tsx`.
- **Layout** — `.wrap` is `max-width: 560px` — this is a mobile-first phone-width page, not a desktop site. Test changes at narrow viewports.
- **Motifs** — `.flag-bands` (horizontal red/white/red stripes) as section dividers; chalk-grid texture on game cards via `::before`; numbered date chips that flip red on match days.

### Stadium and hotel photos

Stadium photos for the three games live in `public/stadiums/` (downloaded from Wikimedia Commons; large public-domain shots). Referenced from `Game.stadiumPhoto` in `trip.ts`. The original design fetched these from Wikipedia at runtime — **don't reintroduce that**; the local files are deliberate (offline-safe, deterministic, no CORS).

Hotel photos same pattern in `public/hotels/`, referenced via `Hotel.photo`.

## Coming later

The user has flagged a future "diary" feature: stories, photos, and notes attached per trip day. The day rendering in `Itinerary.tsx` already takes typed events (`flight | drive | hotel | game | free`) plus an active stay block — adding diary entries means a new event kind keyed by ISO date plus a new render slot, not a structural rewrite.

## Gotchas

- `.design-extract/` is the unpacked design handoff. It contains `.pen`-style HTML/CSS/JS prototypes — **visual reference only**, do not import or render. Gitignored.
- Hotel photos are large (`hotel-sf.png` is ~2.6 MB). If you add more, prefer ~1280px JPGs.
- The trip page is statically prerendered (`○ Static` in build output). Anything that needs to run per-request would have to opt into dynamic rendering.
- Date math uses `new Date(iso + "T12:00:00")` everywhere to avoid timezone-induced day shifts. Keep doing this when adding new date helpers.
