import Link from "next/link";
import type { Game } from "@/data/trip.types";

interface Props {
  game: Game;
  index: number;
}

export default function GameCard({ game, index }: Props) {
  const isAustriaHome = game.home === "Österreich";
  const result = game.result;
  const homeWon = result ? result.homeScore > result.awayScore : false;
  const awayWon = result ? result.awayScore > result.homeScore : false;
  return (
    <article
      className={
        "game-card" + (game.stadiumPhoto ? " has-stadium-photo" : "")
      }
    >
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
        <div className="vs">
          {result ? (
            <span className="score" aria-label="Endstand">
              <b className={homeWon ? "win" : ""}>{result.homeScore}</b>
              <i>:</i>
              <b className={awayWon ? "win" : ""}>{result.awayScore}</b>
            </span>
          ) : (
            "VS"
          )}
        </div>
        <div className={"team" + (!isAustriaHome ? " us" : "")}>
          <div className={"crest flag-" + game.awayFlag} />
          {game.away}
        </div>
      </div>
      {result ? (
        <div className="goals-wrap">
          <div className="goals-head">
            <span className="goals-label">Torschützen</span>
            {result.halftime ? (
              <span className="goals-ht">Halbzeit {result.halftime}</span>
            ) : null}
          </div>
          <ul className="goals">
            {result.goals.map((g, i) => {
              const austriaSide = (g.team === "home") === isAustriaHome;
              return (
                <li key={i} className={"goal" + (austriaSide ? " us" : "")}>
                  <span className="min">{g.minute}&prime;</span>
                  <span className="who">
                    {g.scorer}
                    {g.penalty ? <em className="tag">Elfmeter</em> : null}
                    {g.ownGoal ? <em className="tag">Eigentor</em> : null}
                    {g.assist ? (
                      <span className="assist">Vorlage {g.assist}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="game-meta">
        <div className="full-row">
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
      <div className="game-card-footer">
        <Link className="stay-link" href={`/karte?focus=${game.id}`} prefetch>
          Stadion auf Karte zeigen →
        </Link>
      </div>
    </article>
  );
}
