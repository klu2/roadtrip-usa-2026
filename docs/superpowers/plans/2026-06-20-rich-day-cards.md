# Rich Per-Day Cards + Day Detail Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn each itinerary day into a beautiful, information-rich card (title/subtitle, km, US states with flags, photos, hotel) on the overview, with a full magazine detail page per day at `/tag/[n]`.

**Architecture:** A single aggregator (`lib/day.ts`) builds a `DayView` from the existing data sources (trip, photos, daily km). The overview `Itinerary` maps these to bounded `DayCard`s; a new statically-prerendered route `/tag/[n]` renders the full day (hero, stats, game card, photo gallery, day-focused map, hotel). The map gains a `focusDay` prop that `fitBounds` over a day's geography. New per-day editorial content (title/subtitle/states) lives in `trip.ts`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, plain CSS in `globals.css`, Leaflet (client-only), reuse of the existing global `Lightbox`.

## Global Constraints

- **UI language: German only.** All copy German; dates via `de` locale (already handled by `fmtDate`).
- **Verification = `npm run build`.** No test suite, no lint script (per CLAUDE.md). The build type-checks and prerenders; it is the gate for every task. Plus the manual check each task specifies.
- **Date math:** always `new Date(iso + "T12:00:00")`; reuse helpers in `src/lib/format.ts`. Never hand-roll date parsing.
- **`trip.ts` stays pure data**; all interfaces live in `src/data/trip.types.ts`.
- **Generated files are off-limits** to hand-editing: `src/data/track.ts`, `src/data/route-geometry.ts`, `src/data/photos.ts`.
- **Styling tokens are locked:** `--rot` (#ED2939), `--weiss`, `--pitch`, `--ink`; fonts Archivo Black / Inter / JetBrains Mono. Mobile-first, `.wrap` max-width 560px.
- **No runtime image fetching** — state-flag SVGs are downloaded into `public/states/` (same rationale as stadium/hotel photos).
- **Coords are `[lat, lon]`; dates ISO `YYYY-MM-DD`.**

---

### Task 1: Day types, state lookup, and flag assets

**Files:**
- Modify: `src/data/trip.types.ts` (add `DayInfo`; add `days` to `Trip`)
- Create: `src/data/states.ts`
- Create: `public/states/*.svg` (8 files, downloaded)

**Interfaces:**
- Produces:
  - `interface DayInfo { date: string; title?: string; subtitle?: string; states?: string[] }`
  - `Trip.days: DayInfo[]`
  - `US_STATES: Record<string, { name: string; flag: string }>` from `src/data/states.ts`

- [ ] **Step 1: Add `DayInfo` and extend `Trip` in `src/data/trip.types.ts`**

Add after the `Activity` interface (around line 79):

```ts
export interface DayInfo {
  /** ISO date YYYY-MM-DD — the key for this day. */
  date: string;
  /** Headline, e.g. »Anpfiff in Santa Clara«. */
  title?: string;
  /** One-line description of the day. */
  subtitle?: string;
  /** USPS state codes the day touches, e.g. ["CA","NV"]. */
  states?: string[];
}
```

Add `days` to the `Trip` interface (after `activities: Activity[];`):

```ts
  days: DayInfo[];
```

- [ ] **Step 2: Create `src/data/states.ts`**

```ts
/* US states crossed on the trip → German name + local flag SVG.
   Flags are public-domain SVGs downloaded into public/states/.
   No runtime fetching (same rationale as stadium/hotel photos). */

export const US_STATES: Record<string, { name: string; flag: string }> = {
  CA: { name: "Kalifornien", flag: "/states/ca.svg" },
  NV: { name: "Nevada", flag: "/states/nv.svg" },
  AZ: { name: "Arizona", flag: "/states/az.svg" },
  NM: { name: "New Mexico", flag: "/states/nm.svg" },
  TX: { name: "Texas", flag: "/states/tx.svg" },
  OK: { name: "Oklahoma", flag: "/states/ok.svg" },
  KS: { name: "Kansas", flag: "/states/ks.svg" },
  MO: { name: "Missouri", flag: "/states/mo.svg" },
};
```

- [ ] **Step 3: Download the 8 flag SVGs into `public/states/`**

Run (PowerShell or Bash). Wikimedia `Special:FilePath` redirects to the current SVG; `-L` follows it:

```bash
mkdir -p public/states
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_California.svg" -o public/states/ca.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Nevada.svg"     -o public/states/nv.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Arizona.svg"    -o public/states/az.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_New_Mexico.svg" -o public/states/nm.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Texas.svg"      -o public/states/tx.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Oklahoma.svg"   -o public/states/ok.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kansas.svg"     -o public/states/ks.svg
curl -L "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Missouri.svg"   -o public/states/mo.svg
```

- [ ] **Step 4: Verify the SVGs are real SVG, not an HTML error page**

Run: `head -c 120 public/states/ca.svg`
Expected: starts with `<?xml` or `<svg` (an XML/SVG document). If it starts with `<!DOCTYPE html>` the download failed — retry that file. Also confirm 8 files exist: `ls public/states/`.

- [ ] **Step 5: Build (TRIP.days does not exist yet → expected to fail)**

Run: `npm run build`
Expected: FAIL — TypeScript error "Property 'days' is missing in type ... Trip". This confirms the type change is wired; Task 2 supplies the data. (If you are running tasks out of order, proceed to Task 2 before expecting a green build.)

- [ ] **Step 6: Commit**

```bash
git add src/data/trip.types.ts src/data/states.ts public/states
git commit -m "Add DayInfo type, US_STATES lookup, and state flag assets"
```

---

### Task 2: Author per-day editorial data in `trip.ts`

**Files:**
- Modify: `src/data/trip.ts` (add the `days` array)

**Interfaces:**
- Consumes: `DayInfo`, `Trip.days` (Task 1)
- Produces: `TRIP.days` populated for all 19 days (12–30 Jun 2026)

- [ ] **Step 1: Add the `days` array to `TRIP`**

Insert as a new top-level key inside the `TRIP` object (e.g. directly after `activities: [ … ],` and before the closing `};`). Titles/subtitles are drafts — the user will edit. `states` reflect the known city→city legs.

```ts
  // Per-day editorial content. Titles/subtitles are drafts to edit freely.
  // `states` = USPS codes the day touches (see src/data/states.ts).
  days: [
    { date: "2026-06-12", title: "Anreise über den großen Teich", subtitle: "Wien → Frankfurt → Las Vegas → San Francisco", states: ["CA"] },
    { date: "2026-06-13", title: "San Francisco entdecken", subtitle: "Erster voller Tag in der Bay Area", states: ["CA"] },
    { date: "2026-06-14", title: "Golden Gate & Fisherman's Wharf", subtitle: "Zu Fuß durch die Stadt", states: ["CA"] },
    { date: "2026-06-15", title: "Letzter Tag vor dem Anpfiff", subtitle: "Bay-Area-Stimmung tanken", states: ["CA"] },
    { date: "2026-06-16", title: "Anpfiff in Santa Clara", subtitle: "Österreich – Jordanien · Levi's Stadium", states: ["CA"] },
    { date: "2026-06-17", title: "Über die Wüste nach Vegas", subtitle: "Nachts im Helikopter über dem Strip", states: ["CA", "NV"] },
    { date: "2026-06-18", title: "Tor zum Grand Canyon", subtitle: "Von Las Vegas nach Flagstaff", states: ["NV", "AZ"] },
    { date: "2026-06-19", title: "Auf der Route 66 nach Santa Fe", subtitle: "Wüstenhighways nach New Mexico", states: ["AZ", "NM"] },
    { date: "2026-06-20", title: "Langer Ritt nach Texas", subtitle: "Santa Fe → Dallas", states: ["NM", "TX"] },
    { date: "2026-06-21", title: "Ankommen in Dallas", subtitle: "Basislager für Spiel 2", states: ["TX"] },
    { date: "2026-06-22", title: "Österreich gegen Messi & Co.", subtitle: "Argentinien – Österreich · AT&T Stadium", states: ["TX"] },
    { date: "2026-06-23", title: "Verschnaufen in Dallas", subtitle: "Ruhetag in Texas", states: ["TX"] },
    { date: "2026-06-24", title: "Quer durch die Great Plains", subtitle: "Dallas → Topeka", states: ["TX", "OK", "KS"] },
    { date: "2026-06-25", title: "Unterwegs in Kansas", subtitle: "Etappe noch offen", states: ["KS"] },
    { date: "2026-06-26", title: "Basislager Topeka", subtitle: "Vor dem letzten Gruppenspiel", states: ["KS"] },
    { date: "2026-06-27", title: "Finale in Kansas City", subtitle: "Algerien – Österreich · Arrowhead Stadium", states: ["KS", "MO"] },
    { date: "2026-06-28", title: "Letzte Etappe nach Texas", subtitle: "Topeka → Grapevine (DFW)", states: ["KS", "OK", "TX"] },
    { date: "2026-06-29", title: "Heimreise", subtitle: "Dallas → Houston → Toronto → Wien", states: ["TX"] },
    { date: "2026-06-30", title: "Ankunft in Wien", subtitle: "Zurück in Österreich" },
  ],
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS (type error from Task 1 Step 5 is resolved). All routes still `○ Static`.

- [ ] **Step 3: Commit**

```bash
git add src/data/trip.ts
git commit -m "Add drafted per-day titles, subtitles, and states"
```

---

### Task 3: Day aggregator `lib/day.ts`

**Files:**
- Create: `src/lib/day.ts`

**Interfaces:**
- Consumes: `TRIP` (incl. `TRIP.days`), `PHOTOS`, `DAILY_KM`, `fmtDate`/`tripDay`/`enumerateDays`/`FormattedDate`, trip entity types.
- Produces:
  - `interface DayView { iso; dayNum; fmt; info?; isMatch; game?; flights; drives; postMatchDrives; activities; hotel?; showStayPlaceholder; photos; km?; hours? }`
  - `function buildDay(iso: string): DayView`
  - `function buildAllDays(): DayView[]`

- [ ] **Step 1: Create `src/lib/day.ts`**

```ts
import { TRIP } from "@/data/trip";
import { PHOTOS } from "@/data/photos";
import { DAILY_KM } from "@/data/route-geometry";
import { enumerateDays, fmtDate, tripDay, type FormattedDate } from "@/lib/format";
import type {
  Game,
  Flight,
  Drive,
  Activity,
  Hotel,
  DayInfo,
  TripPhoto,
} from "@/data/trip.types";

export interface DayView {
  iso: string;
  /** 1-based "Tag N" index. */
  dayNum: number;
  fmt: FormattedDate;
  info?: DayInfo;
  isMatch: boolean;
  game?: { game: Game; index: number };
  flights: Flight[];
  /** Drives before the game (or any non-post-match drive). */
  drives: Drive[];
  /** Post-match drives (rendered after the game on match days). */
  postMatchDrives: Drive[];
  activities: Activity[];
  /** The hotel slept in this night, if any. */
  hotel?: Hotel;
  /** True when an unbooked night should show the placeholder. */
  showStayPlaceholder: boolean;
  /** Photos captured this local day (chronological). */
  photos: TripPhoto[];
  /** Road km driven this day (only present for driven days). */
  km?: number;
  /** Total drive hours this day (undefined when no drive). */
  hours?: number;
}

const gameIndexByDate = new Map(TRIP.games.map((g, i) => [g.date, i]));
const kmByDate = new Map(DAILY_KM.map((d) => [d.date, d.km]));

export function buildDay(iso: string): DayView {
  const dayNum = tripDay(iso, TRIP.meta.start);
  const fmt = fmtDate(iso);
  const info = TRIP.days.find((d) => d.date === iso);

  const gi = gameIndexByDate.get(iso);
  const game = gi !== undefined ? { game: TRIP.games[gi], index: gi } : undefined;

  const flights = TRIP.flights.filter((f) => f.date === iso);
  const allDrives = TRIP.drives.filter((d) => d.date === iso);
  const drives = allDrives.filter((d) => !d.afterGame);
  const postMatchDrives = allDrives.filter((d) => d.afterGame);
  const activities = TRIP.activities.filter((a) => a.date === iso);

  const hotel = TRIP.hotels.find((h) => h.checkIn <= iso && iso < h.checkOut);
  const showStayPlaceholder =
    !hotel && flights.length === 0 && iso !== TRIP.meta.end;

  // Photos are grouped by LOCAL capture date (the `time` field), not the
  // UTC-derived id — that's how a traveler thinks of "that day's photos".
  const photos = PHOTOS.filter((p) => p.time.slice(0, 10) === iso);

  const km = kmByDate.get(iso);
  const driveHours = allDrives.reduce((s, d) => s + d.hrs, 0);
  const hours = driveHours > 0 ? driveHours : undefined;

  return {
    iso, dayNum, fmt, info,
    isMatch: !!game, game,
    flights, drives, postMatchDrives, activities,
    hotel, showStayPlaceholder,
    photos, km, hours,
  };
}

export function buildAllDays(): DayView[] {
  return enumerateDays(TRIP.meta.start, TRIP.meta.end).map(buildDay);
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS. (Module compiles and type-checks even though nothing imports it yet.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/day.ts
git commit -m "Add buildDay/buildAllDays day aggregator"
```

---

### Task 4: `DayStats` component + CSS

**Files:**
- Create: `src/components/DayStats.tsx`
- Modify: `src/app/globals.css` (append `.day-stats` block)

**Interfaces:**
- Consumes: `US_STATES` (Task 1)
- Produces: `<DayStats states? km? hours? photoCount? compact? />` — default export, props:
  `{ states?: string[]; km?: number; hours?: number; photoCount?: number; compact?: boolean }`

- [ ] **Step 1: Create `src/components/DayStats.tsx`**

```tsx
import { US_STATES } from "@/data/states";

interface Props {
  states?: string[];
  km?: number;
  hours?: number;
  photoCount?: number;
  compact?: boolean;
}

export default function DayStats({ states, km, hours, photoCount, compact }: Props) {
  const hasStates = !!states && states.length > 0;
  const hasAny = hasStates || km != null || (hours != null) || (!!photoCount && photoCount > 0);
  if (!hasAny) return null;

  return (
    <div className={"day-stats" + (compact ? " compact" : "")}>
      {hasStates && (
        <div className="day-states">
          {states!.map((code) => {
            const s = US_STATES[code];
            if (!s) return null;
            return (
              <span className="state-chip" key={code} title={s.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.flag} alt="" aria-hidden="true" />
                <span>{compact ? code : s.name}</span>
              </span>
            );
          })}
        </div>
      )}
      <div className="day-figures">
        {km != null && (
          <span className="figure">
            <b>{km.toLocaleString("de-DE")}</b> km
          </span>
        )}
        {hours != null && (
          <span className="figure">
            <b>{hours.toLocaleString("de-DE")}</b> h
          </span>
        )}
        {!!photoCount && photoCount > 0 && (
          <span className="figure">
            <b>{photoCount}</b> {photoCount === 1 ? "Foto" : "Fotos"}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Append `.day-stats` styles to `src/app/globals.css`**

```css
/* ---------- Day stats row (overview card + detail) ---------- */
.day-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.day-states { display: flex; flex-wrap: wrap; gap: 6px; }
.state-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 4px;
  border: 1px solid rgba(24, 21, 19, 0.14);
  border-radius: 999px;
  background: var(--weiss);
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.state-chip img {
  width: 22px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(24, 21, 19, 0.12);
  display: block;
}
.day-figures {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: rgba(24, 21, 19, 0.65);
}
.day-figures .figure b { color: var(--ink); font-weight: 600; }
.day-stats.compact .day-figures { font-size: 11px; }
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/DayStats.tsx src/app/globals.css
git commit -m "Add DayStats row (state flags, km, hours, photo count)"
```

---

### Task 5: `PhotoStrip` component + CSS

**Files:**
- Create: `src/components/PhotoStrip.tsx`
- Modify: `src/app/globals.css` (append `.photo-strip` block)

**Interfaces:**
- Consumes: `TripPhoto` (type), Next `Link`
- Produces: `<PhotoStrip photos href max? />` — props `{ photos: TripPhoto[]; href: string; max?: number }`. Renders up to `max` thumbnails (default 5); a `+N` tile and all thumbnails link to `href` (the day detail page).

- [ ] **Step 1: Create `src/components/PhotoStrip.tsx`**

```tsx
import Link from "next/link";
import type { TripPhoto } from "@/data/trip.types";

interface Props {
  photos: TripPhoto[];
  /** Detail-page href the strip links into. */
  href: string;
  max?: number;
}

export default function PhotoStrip({ photos, href, max = 5 }: Props) {
  if (!photos.length) return null;
  const shown = photos.slice(0, max);
  const overflow = photos.length - shown.length;

  return (
    <Link href={href} className="photo-strip" prefetch aria-label={`${photos.length} Fotos ansehen`}>
      {shown.map((p) => (
        <span className="photo-strip-thumb" key={p.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.thumb} alt="" loading="lazy" />
        </span>
      ))}
      {overflow > 0 && <span className="photo-strip-more">+{overflow}</span>}
    </Link>
  );
}
```

- [ ] **Step 2: Append `.photo-strip` styles to `src/app/globals.css`**

```css
/* ---------- Photo strip (overview card) ---------- */
.photo-strip {
  display: flex;
  gap: 6px;
  align-items: center;
  text-decoration: none;
}
.photo-strip-thumb {
  flex: 1 1 0;
  aspect-ratio: 1 / 1;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(24, 21, 19, 0.06);
}
.photo-strip-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-strip-more {
  flex: 0 0 auto;
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--weiss);
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  font-weight: 600;
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/PhotoStrip.tsx src/app/globals.css
git commit -m "Add PhotoStrip thumbnail strip for day cards"
```

---

### Task 6: `DayCard` component + refactor `Itinerary` + card CSS

**Files:**
- Create: `src/components/DayCard.tsx`
- Modify: `src/components/Itinerary.tsx` (replace inline day rendering)
- Modify: `src/app/globals.css` (append `.day-card` block)

**Interfaces:**
- Consumes: `DayView`/`buildAllDays` (Task 3), `DayStats` (Task 4), `PhotoStrip` (Task 5), existing `.crest.flag-<code>` classes, `.flag-bands.thin` separator.
- Produces: `<DayCard day={DayView} last={boolean} />`. `Itinerary` becomes a thin map over `buildAllDays()`.

- [ ] **Step 1: Create `src/components/DayCard.tsx`**

The card keeps the existing `day-block`/`day-header` shell and anchor id (`tag-${dayNum}`) so existing `#tag-N` jump links keep working, but its body is the new rich content. Match days show a compact banner (not the full GameCard).

```tsx
import Link from "next/link";
import type { DayView } from "@/lib/day";
import DayStats from "./DayStats";
import PhotoStrip from "./PhotoStrip";

const BedIcon = () => (
  <svg className="bed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 5 L3 18" /><path d="M3 14 L21 14" /><path d="M3 18 L21 18" />
    <path d="M21 14 L21 18" /><path d="M5 14 L5 10 L11 10 L11 14" />
  </svg>
);

export default function DayCard({ day, last }: { day: DayView; last: boolean }) {
  const { iso, dayNum, fmt, info, isMatch, game, hotel, showStayPlaceholder, photos, km, hours } = day;
  const detailHref = `/tag/${dayNum}`;

  return (
    <article id={`tag-${dayNum}`} className="day-block">
      <header className={"day-header" + (isMatch ? " match" : "")}>
        <div className="day-header-inner">
          <h3 className="day-mark">
            <span className="tag">Tag</span>
            <span className="num">{String(dayNum).padStart(2, "0")}</span>
          </h3>
          <div className="day-rule" aria-hidden="true" />
          <div className="day-date" aria-label={`${fmt.weekday}, ${fmt.day}. ${fmt.month}`}>
            <span className="weekday">{fmt.weekday}</span>
            <span className="day-num">{fmt.day}</span>
          </div>
        </div>
      </header>

      <div className="day-card-body">
        {isMatch && game && (
          <Link href={detailHref} className="match-banner" prefetch>
            <span className="match-banner-tag">Spieltag · Gruppe J</span>
            <span className="match-banner-teams">
              <span className={"crest flag-" + game.game.homeFlag} />
              {game.game.home}
              <span className="match-banner-vs">vs</span>
              {game.game.away}
              <span className={"crest flag-" + game.game.awayFlag} />
            </span>
            <span className="match-banner-meta">{game.game.kickoff} · {game.game.stadium}</span>
          </Link>
        )}

        <div className="day-headline">
          <Link href={detailHref} prefetch className="day-title-link">
            <h4 className="day-title">{info?.title ?? fmt.full}</h4>
          </Link>
          {info?.subtitle && <p className="day-subtitle">{info.subtitle}</p>}
        </div>

        <DayStats states={info?.states} km={km} hours={hours} photoCount={photos.length} compact />

        {photos.length > 0 && <PhotoStrip photos={photos} href={detailHref} max={5} />}

        {hotel ? (
          <div className="day-hotel">
            <BedIcon />
            <span className="day-hotel-name">{hotel.name}</span>
            <span className="day-hotel-city">{hotel.city.split(",")[0]}</span>
          </div>
        ) : showStayPlaceholder ? (
          <div className="day-hotel placeholder">
            <BedIcon />
            <span className="day-hotel-name">Noch nicht gebucht</span>
          </div>
        ) : null}

        <div className="day-actions">
          <Link href={detailHref} className="day-action primary" prefetch>
            Tag ansehen →
          </Link>
          <Link href={`/karte?day=${dayNum}`} className="day-action" prefetch aria-label="Diesen Tag auf der Karte">
            🗺 Karte
          </Link>
        </div>
      </div>

      {!last && <div className="flag-bands thin day-separator" aria-hidden="true" />}
    </article>
  );
}
```

- [ ] **Step 2: Replace `src/components/Itinerary.tsx` with the thin mapper**

```tsx
import { buildAllDays } from "@/lib/day";
import DayCard from "./DayCard";

export default function Itinerary() {
  const days = buildAllDays();
  return (
    <div className="itinerary">
      {days.map((day, idx) => (
        <DayCard key={day.iso} day={day} last={idx === days.length - 1} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Append `.day-card` styles to `src/app/globals.css`**

```css
/* ---------- Rich day card body (overview) ---------- */
.day-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 20px;
}
.match-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--rot);
  color: #fff;
  text-decoration: none;
}
.match-banner-tag {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.85;
}
.match-banner-teams {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
}
.match-banner-teams .crest {
  width: 20px; height: 14px; border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.match-banner-vs { opacity: 0.8; font-size: 12px; font-weight: 600; }
.match-banner-meta {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  opacity: 0.9;
}
.day-headline { display: flex; flex-direction: column; gap: 2px; }
.day-title-link { text-decoration: none; color: inherit; }
.day-title {
  font-family: "Archivo Black", sans-serif;
  font-size: 19px;
  line-height: 1.12;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.day-subtitle { font-size: 13.5px; color: rgba(24, 21, 19, 0.62); }
.day-hotel {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink);
}
.day-hotel .bed-icon { width: 18px; height: 18px; color: rgba(24, 21, 19, 0.55); flex: 0 0 auto; }
.day-hotel-name { font-weight: 600; }
.day-hotel-city { color: rgba(24, 21, 19, 0.5); font-family: "JetBrains Mono", monospace; font-size: 11px; }
.day-hotel.placeholder .day-hotel-name { color: rgba(24, 21, 19, 0.45); font-style: italic; font-weight: 500; }
.day-actions { display: flex; gap: 8px; margin-top: 2px; }
.day-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(24, 21, 19, 0.16);
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  color: var(--ink);
}
.day-action.primary { background: var(--ink); color: var(--weiss); border-color: var(--ink); }
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS, all routes `○ Static`. Note the old `StayBlock`/event rendering is intentionally gone from the overview (it moves to the detail page in Task 8).

- [ ] **Step 5: Manual verify**

Run: `npm run dev`, open `http://localhost:3000`. Confirm: each day shows a card with title/subtitle; days 13–16 show a photo strip; days 16/22/27 show the red match banner (not a full stadium card); the SF days show CA flag chips; `Tag ansehen →` and `🗺 Karte` buttons appear; the `#tag-N` jump row still scrolls to the right day.

- [ ] **Step 6: Commit**

```bash
git add src/components/DayCard.tsx src/components/Itinerary.tsx src/app/globals.css
git commit -m "Replace itinerary rows with rich day cards"
```

---

### Task 7: Map day-focus (`/karte?day=N`)

**Files:**
- Modify: `src/components/Map.tsx` (add `focusDay` prop + per-day fitBounds)
- Modify: `src/components/MapClient.tsx` (pass `focusDay` through)
- Modify: `src/app/karte/page.tsx` (read `?day=`)

**Interfaces:**
- Consumes: `buildDay`/`enumerateDays` (Task 3 / format), existing Map internals.
- Produces: `MapClient`/`TripMap` accept `focusDay?: number`. `/karte?day=<n>` frames day `n`'s photos ∪ hotel ∪ game.

- [ ] **Step 1: Add `focusDay` to `Map.tsx` props and effect deps**

In `src/components/Map.tsx`, extend the `Props` interface (after `focusId?: string;`):

```ts
  /** 1-based trip-day number to frame the map on (overrides the trip-wide fit). */
  focusDay?: number;
```

Update the component signature:

```ts
export default function TripMap({ interactive = false, className, focusId, focusDay }: Props) {
```

Add `focusDay` to the effect dependency array at the end of the `useEffect` (currently `[interactive, focusId]`):

```ts
  }, [interactive, focusId, focusDay]);
```

- [ ] **Step 2: Add the day-focus fitBounds, after the existing focus block**

In `Map.tsx`, locate the trip-wide fit + focus near the end of the async block:

```ts
      if (routeLatLngs.length) {
        map.fitBounds(L.latLngBounds(routeLatLngs), { padding: [30, 30] });
      } else {
        map.setView([39, -98], 4);
      }

      // Focus a specific marker if requested via ?focus=<id> —
      if (focusId && markers[focusId]) {
        markers[focusId].openPopup();
      }
```

Insert immediately after the `focusId` block (still inside the async IIFE) — it must come last so its bounds win:

```ts
      // Frame a single day if requested via ?day=<n>: bounds over that day's
      // photo GPS, the night's hotel, and the game (if any).
      if (focusDay != null) {
        const dayIso = enumerateDays(TRIP.meta.start, TRIP.meta.end)[focusDay - 1];
        if (dayIso) {
          const dv = buildDay(dayIso);
          const pts: [number, number][] = [
            ...dv.photos.map((p) => p.coords),
            ...(dv.hotel ? [dv.hotel.coords] : []),
            ...(dv.game ? [dv.game.game.coords] : []),
          ];
          if (pts.length === 1) {
            map.setView(pts[0], 11);
          } else if (pts.length > 1) {
            map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 12 });
          }
        }
      }
```

Add the imports at the top of `Map.tsx` (alongside the existing imports):

```ts
import { enumerateDays } from "@/lib/format";
import { buildDay } from "@/lib/day";
```

(`fmtDate`/`stayBadge` are already imported from `@/lib/format`; add `enumerateDays` to that line or as a separate import — both compile.)

- [ ] **Step 3: Pass `focusDay` through `MapClient.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="map-host" />,
});

interface Props {
  interactive?: boolean;
  className?: string;
  focusId?: string;
  focusDay?: number;
}

export default function MapClient(props: Props) {
  return <TripMap {...props} />;
}
```

- [ ] **Step 4: Read `?day=` in `src/app/karte/page.tsx`**

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import MapClient from "@/components/MapClient";

export const metadata: Metadata = {
  title: "Karte — WM-Roadtrip 2026",
};

interface PageProps {
  searchParams: Promise<{ focus?: string | string[]; day?: string | string[] }>;
}

export default async function KartePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const focusId = typeof params.focus === "string" ? params.focus : undefined;
  const dayRaw = typeof params.day === "string" ? params.day : undefined;
  const focusDay = dayRaw && /^\d+$/.test(dayRaw) ? Number(dayRaw) : undefined;

  return (
    <div className="karte-page">
      <header className="karte-header">
        <Link href="/" className="karte-back" prefetch>
          ← Übersicht
        </Link>
        <div className="karte-title">WM-Roadtrip · Karte</div>
        <div className="karte-spacer" aria-hidden="true" />
      </header>
      <div className="karte-map">
        <MapClient interactive className="map-host fill" focusId={focusId} focusDay={focusDay} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS. `/karte` stays `○ Static` (searchParams still renders statically; reading them client-paints).

- [ ] **Step 6: Manual verify**

`npm run dev` → open `http://localhost:3000/karte?day=6` (day 6 = 17 Jun, Vegas). Map should frame the Bay-Area→Vegas area, not the whole USA. `http://localhost:3000/karte?focus=h3` still opens the Vegas hotel popup (unchanged). `http://localhost:3000/karte` still fits the whole route.

- [ ] **Step 7: Commit**

```bash
git add src/components/Map.tsx src/components/MapClient.tsx src/app/karte/page.tsx
git commit -m "Add per-day map focus via ?day=N"
```

---

### Task 8: Day detail page `/tag/[n]` + photo gallery

**Files:**
- Create: `src/app/tag/[n]/page.tsx`
- Create: `src/components/PhotoGallery.tsx`
- Modify: `src/app/globals.css` (append `.tag-detail` + `.photo-gallery` block)

**Interfaces:**
- Consumes: `buildDay`/`buildAllDays` (Task 3), `enumerateDays`/`TRIP` (data), `DayStats` (Task 4), `GameCard` (existing), the existing global `Lightbox` via the `window` `"lightbox:open"` CustomEvent (`detail: { slides: {src,alt,caption}[], index }`).
- Produces: statically prerendered `/tag/[n]` for every trip day; `<PhotoGallery photos={TripPhoto[]} />` (client) dispatching `lightbox:open`.

- [ ] **Step 1: Create `src/components/PhotoGallery.tsx`**

Reuses the existing global Lightbox (mounted in `layout.tsx`) by dispatching the same event the map uses — gives free prev/next within the day.

```tsx
"use client";

import type { TripPhoto } from "@/data/trip.types";

export default function PhotoGallery({ photos }: { photos: TripPhoto[] }) {
  if (!photos.length) return null;

  const slides = photos.map((p) => ({ src: p.full, alt: p.caption || "", caption: p.caption || "" }));
  const open = (index: number) =>
    window.dispatchEvent(new CustomEvent("lightbox:open", { detail: { slides, index } }));

  return (
    <div className="photo-gallery">
      {photos.map((p, i) => (
        <button type="button" className="photo-gallery-item" key={p.id} onClick={() => open(i)} aria-label="Foto vergrößern">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.thumb} alt={p.caption || ""} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/tag/[n]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRIP } from "@/data/trip";
import { enumerateDays } from "@/lib/format";
import { buildDay } from "@/lib/day";
import DayStats from "@/components/DayStats";
import GameCard from "@/components/GameCard";
import PhotoGallery from "@/components/PhotoGallery";
import MapClient from "@/components/MapClient";

const DAY_ISOS = enumerateDays(TRIP.meta.start, TRIP.meta.end);

export function generateStaticParams() {
  return DAY_ISOS.map((_, i) => ({ n: String(i + 1) }));
}

function parseN(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const num = Number(n);
  return num >= 1 && num <= DAY_ISOS.length ? num : null;
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const num = parseN(n);
  if (!num) return { title: "Tag — WM-Roadtrip 2026" };
  const day = buildDay(DAY_ISOS[num - 1]);
  const title = day.info?.title ? `Tag ${num}: ${day.info.title}` : `Tag ${num}`;
  return { title: `${title} — WM-Roadtrip 2026` };
}

export default async function TagPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = parseN(n);
  if (!num) notFound();

  const day = buildDay(DAY_ISOS[num - 1]);
  const { dayNum, fmt, info, isMatch, game, flights, drives, postMatchDrives, hotel, photos, km, hours } = day;

  const hero = photos.find((p) => p.w >= p.h) ?? photos[0];
  const prev = num > 1 ? num - 1 : null;
  const next = num < DAY_ISOS.length ? num + 1 : null;

  const Nav = () => (
    <nav className="tag-nav">
      {prev ? <Link href={`/tag/${prev}`} className="tag-nav-link" prefetch>← Tag {prev}</Link> : <span className="tag-nav-link disabled">←</span>}
      <Link href="/#plan" className="tag-nav-home" prefetch>Übersicht</Link>
      {next ? <Link href={`/tag/${next}`} className="tag-nav-link" prefetch>Tag {next} →</Link> : <span className="tag-nav-link disabled">→</span>}
    </nav>
  );

  return (
    <div className="tag-detail">
      <Nav />

      {hero && (
        <div className="tag-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.full} alt={info?.title || fmt.full} />
        </div>
      )}

      <header className="tag-head">
        <div className={"tag-eyebrow" + (isMatch ? " match" : "")}>
          Tag {String(dayNum).padStart(2, "0")} · {fmt.full}
        </div>
        <h1 className="tag-title">{info?.title ?? fmt.full}</h1>
        {info?.subtitle && <p className="tag-subtitle">{info.subtitle}</p>}
        <DayStats states={info?.states} km={km} hours={hours} photoCount={photos.length} />
      </header>

      {isMatch && game && (
        <section className="tag-section">
          <GameCard game={game.game} index={game.index} />
        </section>
      )}

      {(flights.length > 0 || drives.length > 0 || postMatchDrives.length > 0) && (
        <section className="tag-section tag-legs">
          {flights.map((f) => (
            <div key={f.id} className="tag-leg">
              <div className="tag-leg-type">Flug · {f.depart} → {f.arrive}</div>
              <div className="tag-leg-title">{f.from.city} ({f.from.code}) → {f.to.city} ({f.to.code})</div>
              <div className="tag-leg-sub">{f.airline} {f.number} · {f.duration}{f.note ? ` · ${f.note}` : ""}</div>
            </div>
          ))}
          {[...drives, ...postMatchDrives].map((d) => (
            <div key={d.id} className="tag-leg">
              <div className="tag-leg-type">{d.afterGame ? "Heimfahrt nach dem Spiel" : "Fahrt"}</div>
              <div className="tag-leg-title">{d.from} → {d.to}</div>
              <div className="tag-leg-sub">~{d.km} km · ~{d.hrs} h</div>
            </div>
          ))}
        </section>
      )}

      {photos.length > 0 && (
        <section className="tag-section">
          <h2 className="tag-section-head">Fotos</h2>
          <PhotoGallery photos={photos} />
        </section>
      )}

      <section className="tag-section">
        <h2 className="tag-section-head">Auf der Karte</h2>
        <div className="tag-map">
          <MapClient interactive className="map-host fill" focusDay={dayNum} />
        </div>
      </section>

      {hotel && (
        <section className="tag-section">
          <h2 className="tag-section-head">Übernachtung</h2>
          <div className="tag-hotel">
            {hotel.photo && (
              <div className="stay-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hotel.photo} alt={hotel.name} loading="lazy" />
              </div>
            )}
            <div>
              <div className="tag-hotel-name">{hotel.name}</div>
              <div className="tag-hotel-city">{hotel.city}</div>
              {hotel.notes && <div className="tag-hotel-notes">{hotel.notes}</div>}
            </div>
          </div>
        </section>
      )}

      <Nav />
    </div>
  );
}
```

- [ ] **Step 3: Append `.tag-detail` + `.photo-gallery` styles to `src/app/globals.css`**

```css
/* ---------- Day detail page (/tag/[n]) ---------- */
.tag-detail { max-width: 560px; margin: 0 auto; padding: 14px 18px 40px; }
.tag-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  padding: 8px 0;
}
.tag-nav-link, .tag-nav-home { text-decoration: none; color: var(--ink); padding: 6px 10px; border-radius: 7px; }
.tag-nav-home { background: var(--ink); color: var(--weiss); }
.tag-nav-link.disabled { color: rgba(24, 21, 19, 0.3); }
.tag-hero {
  margin: 8px 0 16px;
  border-radius: 14px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: rgba(24, 21, 19, 0.06);
}
.tag-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tag-eyebrow {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(24, 21, 19, 0.6);
}
.tag-eyebrow.match { color: var(--rot); }
.tag-title {
  font-family: "Archivo Black", sans-serif;
  font-size: 28px;
  line-height: 1.08;
  letter-spacing: -0.015em;
  margin: 4px 0 6px;
  color: var(--ink);
}
.tag-subtitle { font-size: 15px; color: rgba(24, 21, 19, 0.65); margin-bottom: 12px; }
.tag-head { margin-bottom: 8px; }
.tag-section { margin-top: 22px; }
.tag-section-head {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(24, 21, 19, 0.55);
  margin-bottom: 10px;
}
.tag-legs { display: flex; flex-direction: column; gap: 10px; }
.tag-leg { padding: 10px 12px; border: 1px solid rgba(24, 21, 19, 0.12); border-radius: 10px; }
.tag-leg-type { font-family: "JetBrains Mono", monospace; font-size: 11px; color: rgba(24, 21, 19, 0.55); }
.tag-leg-title { font-weight: 600; margin: 2px 0; }
.tag-leg-sub { font-size: 13px; color: rgba(24, 21, 19, 0.6); }
.tag-map { height: 280px; border-radius: 14px; overflow: hidden; }
.tag-map .map-host { width: 100%; height: 100%; }
.tag-hotel { display: flex; gap: 12px; align-items: flex-start; }
.tag-hotel .stay-photo { width: 110px; height: 110px; flex: 0 0 auto; border-radius: 10px; overflow: hidden; }
.tag-hotel-name { font-weight: 700; }
.tag-hotel-city { font-family: "JetBrains Mono", monospace; font-size: 12px; color: rgba(24, 21, 19, 0.55); }
.tag-hotel-notes { font-size: 13px; color: rgba(24, 21, 19, 0.6); margin-top: 4px; }

/* ---------- Photo gallery grid (detail) ---------- */
.photo-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.photo-gallery-item {
  padding: 0; border: 0; cursor: pointer; background: rgba(24, 21, 19, 0.06);
  aspect-ratio: 1 / 1; border-radius: 8px; overflow: hidden;
}
.photo-gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS. Build output lists `/tag/[n]` prerendered for each day (look for `● /tag/[n]` with 19 paths, or `○` entries). No type errors.

- [ ] **Step 5: Manual verify**

`npm run dev`:
- `http://localhost:3000/tag/5` (16 Jun, match) → hero photo, big title »Anpfiff in Santa Clara«, stats bar, full `GameCard`, photo gallery, embedded map framed on Santa Clara, hotel block, prev/next nav.
- Click a gallery photo → global lightbox opens with prev/next and count.
- `http://localhost:3000/tag/1` → no hero/gallery (no photos that day), still renders flights + map + nav.
- `http://localhost:3000/tag/99` → 404 (out of range).
- From the overview, `Tag ansehen →` navigates to the matching detail page.

- [ ] **Step 6: Commit**

```bash
git add src/app/tag src/components/PhotoGallery.tsx src/app/globals.css
git commit -m "Add /tag/[n] day detail page with gallery and day map"
```

---

## Self-Review

**Spec coverage:**
- Data model (`DayInfo`, `Trip.days`, `states.ts`, flags) → Task 1; authored content → Task 2. ✓
- `lib/day.ts` aggregator (`buildDay`/`buildAllDays`, photo-by-local-date, km/hours) → Task 3. ✓
- `DayStats` (flags/km/hours/photos) → Task 4; `PhotoStrip` → Task 5. ✓
- `DayCard` rich bounded card + uniform compact match banner + `Itinerary` refactor → Task 6. ✓
- Map day-focus `?day=N` (`focusDay` prop, fitBounds over day geo, `focusId` untouched) → Task 7. ✓
- `/tag/[n]` full magazine page (hero, title, stats, GameCard, gallery+lightbox, day map, hotel, prev/next, static params) → Task 8. ✓
- Graceful degradation for future/photo-less days → handled in `buildDay` + conditional rendering in Tasks 6 & 8. ✓
- German-only, token system, `npm run build` gate, no runtime fetch → Global Constraints + per-task. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; CSS provided in full. ✓

**Type consistency:** `DayView` field names (`game.game`, `photos`, `km`, `hours`, `info`) are used identically in Tasks 6, 7, 8. `US_STATES[code] → {name, flag}` consistent in Task 4. Lightbox event shape `{ slides:[{src,alt,caption}], index }` matches the existing `Lightbox.tsx` consumer. `focusDay?: number` consistent across `Map.tsx`/`MapClient.tsx`/`karte/page.tsx`. ✓

**Note for executor:** Task 1 Step 5 intentionally leaves the build red until Task 2 adds `TRIP.days`. If running tasks individually, treat Tasks 1+2 as the first green checkpoint.
