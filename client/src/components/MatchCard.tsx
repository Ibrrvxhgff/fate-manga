import { ChevronLeft, Clock3, MapPin, Radio } from "lucide-react";
import { Link } from "wouter";
import type { Match, Team } from "@shared/matches";
import { statusText } from "@/lib/matches";

function TeamBadge({ team }: { team: Team }) {
  return <span className="team-badge" style={{ background: `linear-gradient(145deg, ${team.accent}, #151515)` }} aria-hidden="true">{team.shortName.slice(0, 2)}</span>;
}

export default function MatchCard({ match, compact = false }: { match: Match; compact?: boolean }) {
  const score = match.status === "scheduled" ? "– : –" : `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`;
  return (
    <Link href={`/match/${match.id}`} className={`match-card match-card--${match.status} ${compact ? "match-card--compact" : ""}`}>
      <div className="match-card__topline">
        <span className="match-card__competition">{match.competition.name}</span>
        <span className={`status-pill status-pill--${match.status}`}>
          {match.status === "live" ? <Radio size={12} /> : <Clock3 size={12} />}
          {statusText(match)}
        </span>
      </div>
      <div className="match-card__teams">
        <div className="team team--home"><TeamBadge team={match.home} /><span>{match.home.name}</span></div>
        <div className="match-card__score"><strong>{score}</strong><small>{match.kickoff}</small></div>
        <div className="team team--away"><span>{match.away.name}</span><TeamBadge team={match.away} /></div>
      </div>
      {!compact && <div className="match-card__meta"><span><MapPin size={13} />{match.venue}</span><span>{match.stage}</span><ChevronLeft size={15} className="match-card__arrow" /></div>}
    </Link>
  );
}
