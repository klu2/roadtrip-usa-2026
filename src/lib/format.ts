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
