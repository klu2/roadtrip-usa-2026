# Rich per-day cards + day detail pages — Design

Date: 2026-06-20
Status: Approved (pending spec review)

## Goal

Replace the thin per-day blocks in the itinerary (which today only show
hotel/flight/drive/game rows) with **beautiful, information-rich day boxes**
that surface everything the trip now produces: kilometers driven, US states
crossed (with state flags), the day's photos, the hotel, and a human
title/subtitle describing what happened that day. Because 19 fully-detailed
days would make one page very long, the timeline stays a stack of **bounded,
scannable cards**, and the full depth (hero, gallery, focused map, game card)
lives on a dedicated **`/tag/[n]` detail page** per day — which is also the
future home of the planned diary feature.

## Decisions (from brainstorming)

1. **Structure = Hybrid.** Rich-but-bounded timeline cards + full magazine
   detail page per day.
2. **Titles/subtitles = I draft, user edits.** German draft title + subtitle
   for every day, stored in `trip.ts`, user overwrites freely.
3. **Detail page = full magazine.** Hero, big title, stats, game card, full
   photo gallery with lightbox, embedded day-focused map, hotel, drives,
   prev/next nav.
4. **Match days on overview = uniform compact cards.** Every day (including the
   three games) uses the same bounded card; match days get a prominent match
   banner line. The full `GameCard` appears only on the detail page.
5. **Map day-focus deep link.** A day links to the map framed to that day's
   geography (photos + hotel + game), via a new `?day=` param.

## Data model

### New types (`src/data/trip.types.ts`)

```ts
export interface DayInfo {
  /** ISO date YYYY-MM-DD — the key. */
  date: string;
  /** Headline, e.g. »Anpfiff in Santa Clara«. */
  title?: string;
  /** One-line description of the day. */
  subtitle?: string;
  /** USPS state codes the day's driving crosses, e.g. ["CA","NV"]. */
  states?: string[];
}
```

`Trip` gains `days: DayInfo[]`.

### New data (`src/data/trip.ts`)

- `days: DayInfo[]` — one entry per day that has authored content. Days absent
  from the array (or with empty fields) fall back gracefully in the UI. I will
  draft `title`/`subtitle` in German for all 19 days and fill `states` for the
  driving days from the known city→city legs:
  - 16 Jun SF→Sunnyvale: CA
  - 17 Jun Sunnyvale→Las Vegas: CA, NV
  - 18 Jun Las Vegas→Flagstaff: NV, AZ
  - 19 Jun Flagstaff→Santa Fe: AZ, NM
  - 20 Jun Santa Fe→Dallas: NM, TX
  - 24 Jun Dallas→Topeka: TX, OK, KS
  - 28 Jun Topeka→Grapevine: KS, OK, TX
  - (SF pre-trip days + match/rest days: CA / TX / MO / KS as applicable)

### New lookup (`src/data/states.ts`)

```ts
export const US_STATES: Record<string, { name: string; flag: string }> = {
  CA: { name: "Kalifornien", flag: "/states/ca.svg" },
  NV: { name: "Nevada",      flag: "/states/nv.svg" },
  AZ: { name: "Arizona",     flag: "/states/az.svg" },
  NM: { name: "New Mexico",  flag: "/states/nm.svg" },
  TX: { name: "Texas",       flag: "/states/tx.svg" },
  OK: { name: "Oklahoma",    flag: "/states/ok.svg" },
  KS: { name: "Kansas",      flag: "/states/ks.svg" },
  MO: { name: "Missouri",    flag: "/states/mo.svg" },
};
```

State-flag SVGs are downloaded from Wikimedia Commons (public domain) into
`public/states/<code>.svg` — same offline/deterministic rationale as the
existing stadium and hotel photos (no runtime fetch).

### Derived day data (`src/lib/day.ts`)

A single aggregator so the card and the detail page never diverge:

```ts
export interface DayView {
  iso: string;
  dayNum: number;            // tripDay()
  fmt: FormattedDate;
  info?: DayInfo;            // title/subtitle/states
  isMatch: boolean;
  game?: { game: Game; index: number };
  flights: Flight[];
  drives: Drive[];           // non-afterGame
  postMatchDrives: Drive[];
  activities: Activity[];
  hotel?: Hotel;             // active stay
  showStayPlaceholder: boolean;
  photos: TripPhoto[];       // PHOTOS where time.slice(0,10) === iso
  km?: number;               // DAILY_KM lookup
  hours?: number;            // sum of the day's drive hrs (if any)
}

export function buildDay(iso: string): DayView
export function buildAllDays(): DayView[]   // enumerateDays(start,end).map(buildDay)
```

Photos are grouped by **local capture date** (`photo.time`, not the UTC-derived
`id`), matching how a traveler thinks of "that day's photos".

## Components

### Timeline (overview)

- **`Itinerary.tsx`** — reduces to `buildAllDays().map(d => <DayCard … />)` with
  the flag-band separators between cards (kept).
- **`DayCard.tsx`** (server component) — the bounded rich card:
  - Header: `TAG NN`, weekday + day number, match treatment (red) when
    `isMatch`. Anchor id `tag-${dayNum}` preserved (existing deep links).
  - Match banner line on match days (compact: flags + opponent + kickoff),
    NOT the full GameCard.
  - Title + subtitle (display font); neutral fallback header if absent.
  - `<DayStats compact />` row.
  - `<PhotoStrip photos={…} max={5} href={/tag/n} />` — thumbnails + `+N` tile;
    omitted when no photos.
  - Hotel one-liner (bed icon) or the existing "noch nicht gebucht" placeholder.
  - Actions: `Tag ansehen →` (`/tag/${dayNum}`) and `🗺 Karte` (`/karte?day=${dayNum}`).
- **`DayStats.tsx`** — reusable stat row used by both card and detail. Renders
  only the stats present: state-flag chips (flag img + German name), `km`,
  drive `hours`, photo count. `compact` prop tunes sizing.
- **`PhotoStrip.tsx`** — horizontal thumbnail strip with `+N` overflow tile.

### Detail page

- **`src/app/tag/[n]/page.tsx`** — statically prerendered.
  - `generateStaticParams()` → one entry per trip day (1..N).
  - `generateMetadata()` → `Tag NN · <title> — WM-Roadtrip 2026`.
  - Layout: back-to-overview + prev/next nav → hero photo (first landscape
    photo of the day, else first photo, else a flag-band placeholder) →
    `TAG NN · Dienstag 16. Juni` + title/subtitle → `<DayStats />` bar →
    full `GameCard` if match → flights/drives detail rows (reuse existing
    event markup) → **`<PhotoGallery />`** → embedded **day-focused map**
    (`MapClient interactive focusDay={n}`) → hotel block → prev/next nav.
- **`PhotoGallery.tsx`** (client) — responsive grid of the day's photos;
  click opens **`Lightbox.tsx`**.
- **`Lightbox.tsx`** (client) — full-screen overlay, next/prev within the day,
  Esc/backdrop to close, caption if present. Self-contained; no new deps.

### Map day-focus

- **`MapClient.tsx`** — pass through a new optional `focusDay?: number` prop.
- **`Map.tsx`** — when `focusDay` is set, compute that day's bounds from
  `buildDay(iso)` geography (photo coords ∪ active hotel coords ∪ game coords)
  and `map.fitBounds(bounds, { padding })`. Falls back to the existing default
  view if the day has no geo. Existing `focusId` (hotel focus) is untouched.
- **`src/app/karte/page.tsx`** — read `?day=<n>` from `searchParams`, resolve to
  the ISO/day index, pass `focusDay` to `MapClient`.

## Graceful degradation (trip is ongoing — today is day 9 of 19)

- **Past days** (have photos, km, states) → full rich card.
- **Future days** (plan only) → card shows title/subtitle + hotel + planned
  drive/states; km, hours and photo strip simply don't render.
- **No authored `DayInfo`** → neutral header (date only), rest still renders.
- Detail page with no photos → no hero/gallery; map + plan still shown.

## Styling

Plain CSS in `globals.css`, within the locked token system (`--rot`, `--weiss`,
`--pitch`, `--ink`; Archivo Black / Inter / JetBrains Mono). Mobile-first,
`.wrap` max-width 560px. New classes namespaced (`.day-card`, `.day-stats`,
`.photo-strip`, `.tag-detail`, `.lightbox`, …). Match-day red treatment and the
`.flag-bands` separators are reused, not reinvented.

## Out of scope (later)

- The diary feature itself (stories/notes per day) — the detail page is built
  to receive it, but no diary data/UI in this pass.
- Editing photo captions / curating which photos appear (existing manifest
  workflow unchanged).

## Verification

`npm run build` (type-check + SSR/prerender of all `/tag/[n]` routes) must pass.
Manually: overview cards render for past + future days; a match day shows the
banner not the full card; `/tag/6` shows hero/gallery/map; lightbox opens and
navigates; `/karte?day=6` frames day 6.
