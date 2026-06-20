export interface FormattedDate {
  day: number;
  month: string;
  weekday: string;
  full: string;
  monthShort: string;
}

export const fmtDate = (iso: string): FormattedDate => {
  const d = new Date(iso + "T12:00:00");
  return {
    day: d.getDate(),
    month: d.toLocaleString("de", { month: "short" }).replace(".", ""),
    monthShort: d.toLocaleString("de", { month: "short" }).replace(".", "").slice(0, 3),
    weekday: d.toLocaleString("de", { weekday: "short" }).replace(".", ""),
    full: d.toLocaleString("de", { weekday: "long", month: "long", day: "numeric" }),
  };
};

// Editorial day a photo belongs to. A capture before this hour (local wall
// clock) is folded into the previous day, so late-night shots — e.g. the Vegas
// helicopter flight just after midnight — stay with the day they belong to.
const DAY_CUTOFF_HOUR = 3;

// `time` is local "YYYY-MM-DDTHH:MM:SS". Returns the ISO date the photo counts
// toward. UTC math keeps the rollover deterministic and timezone-proof.
export const photoDay = (time: string): string => {
  const hour = Number(time.slice(11, 13));
  if (hour >= DAY_CUTOFF_HOUR) return time.slice(0, 10);
  const [y, m, d] = time.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
};

export const enumerateDays = (startIso: string, endIso: string): string[] => {
  const start = new Date(startIso + "T12:00:00");
  const end = new Date(endIso + "T12:00:00");
  const out: string[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const MS_PER_DAY = 86_400_000;

// 1-based trip night index: night of `startIso` is 1.
export const tripNight = (iso: string, startIso: string): number => {
  const start = new Date(startIso + "T12:00:00").getTime();
  const d = new Date(iso + "T12:00:00").getTime();
  return Math.round((d - start) / MS_PER_DAY) + 1;
};

// 1-based trip day index — same math as tripNight, named for the "Tag N" UI.
export const tripDay = tripNight;

// Number of nights between checkIn and checkOut (1 if same calendar day stay).
export const nightsCount = (checkIn: string, checkOut: string): number => {
  const a = new Date(checkIn + "T12:00:00").getTime();
  const b = new Date(checkOut + "T12:00:00").getTime();
  return Math.max(1, Math.round((b - a) / MS_PER_DAY));
};

// Badge text for a stay: "5" for one night, "1-4" for a range.
// `checkOut` is the morning of departure → last slept night is checkOut - 1.
export const stayBadge = (
  checkIn: string,
  checkOut: string,
  startIso: string
): string => {
  const first = tripNight(checkIn, startIso);
  const co = new Date(checkOut + "T12:00:00");
  co.setDate(co.getDate() - 1);
  const lastIso = co.toISOString().slice(0, 10);
  const last = tripNight(lastIso, startIso);
  return first === last ? String(first) : `${first}-${last}`;
};
