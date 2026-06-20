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
  const { iso, dayNum, fmt, info, isMatch, game, hotel, showStayPlaceholder, photos, km } = day;
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
            <span className="match-banner-tag">
              Spieltag · Gruppe J
              {game.game.result && <span className="match-banner-final">Endstand</span>}
            </span>
            <span className="match-banner-teams">
              <span className={"crest flag-" + game.game.homeFlag} />
              {game.game.home}
              {game.game.result ? (
                <span className="match-banner-score">
                  {game.game.result.homeScore}:{game.game.result.awayScore}
                </span>
              ) : (
                <span className="match-banner-vs">vs</span>
              )}
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

        <DayStats states={info?.states} km={km} photoCount={photos.length} compact />

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
