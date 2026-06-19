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
