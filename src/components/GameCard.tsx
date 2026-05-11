import type { Game } from "@/data/trip";
import { fmtDate } from "@/lib/format";

interface Props {
  game: Game;
  index: number;
}

export default function GameCard({ game, index }: Props) {
  const isAustriaHome = game.home === "Österreich";
  const d = fmtDate(game.date);
  return (
    <article className={"game-card" + (game.stadiumPhoto ? " has-stadium-photo" : "")}>
      <div className="ribbon">{`Spiel ${index + 1} · Gruppe J`}</div>
      {game.stadiumPhoto ? (
        <div className="stadium-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.stadiumPhoto} alt={game.stadium} loading="lazy" />
        </div>
      ) : null}
      <div className="matchup">
        <div className={"team" + (isAustriaHome ? " us" : "")}>
          <div className={"crest flag-" + game.homeFlag} />
          {game.home}
        </div>
        <div className="vs">VS</div>
        <div className={"team" + (!isAustriaHome ? " us" : "")}>
          <div className={"crest flag-" + game.awayFlag} />
          {game.away}
        </div>
      </div>
      <div className="game-meta">
        <div>
          <div className="k">Datum</div>
          <div className="v">
            {d.weekday}, {d.day} {d.month}
          </div>
        </div>
        <div>
          <div className="k">Anpfiff (lokal · Wien)</div>
          <div className="v">
            {game.kickoff} · {game.kickoffVie || "—"}
          </div>
        </div>
        <div>
          <div className="k">Stadion</div>
          <div className="v">{game.stadium}</div>
        </div>
        <div>
          <div className="k">Stadt</div>
          <div className="v">{game.city}</div>
        </div>
      </div>
    </article>
  );
}
