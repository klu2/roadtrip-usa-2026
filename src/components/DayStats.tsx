import { US_STATES } from "@/data/states";

const CarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 16 H21" />
    <path d="M5 16 L5 13 L7.5 9 H16.5 L19 13 L19 16" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="8" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

interface Props {
  states?: string[];
  km?: number;
  photoCount?: number;
  compact?: boolean;
}

export default function DayStats({ states, km, photoCount, compact }: Props) {
  const hasStates = !!states && states.length > 0;
  const hasPhotos = !!photoCount && photoCount > 0;
  const hasAny = hasStates || km != null || hasPhotos;
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
      {km != null && (
        <span className="day-distance">
          <CarIcon />
          <b>{km.toLocaleString("de-DE")}</b> km
        </span>
      )}
      {hasPhotos && (
        <span className="day-figure-photos">
          {photoCount} {photoCount === 1 ? "Foto" : "Fotos"}
        </span>
      )}
    </div>
  );
}
