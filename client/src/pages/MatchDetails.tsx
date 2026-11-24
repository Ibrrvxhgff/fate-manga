import { ArrowRight, CalendarDays, Clock3, MapPin, Radio, ShieldCheck, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import SiteShell from "@/components/SiteShell";
import { fetchMatch, formatFullDate, statusText } from "@/lib/matches";
import type { Match } from "@shared/matches";
import NotFound from "@/pages/NotFound";

export default function MatchDetails() {
  const [, params] = useRoute("/match/:id");
  const [, setLocation] = useLocation();
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (params?.id) fetchMatch(params.id).then(setMatch).catch(err => setError(err.message)); }, [params?.id]);
  useEffect(() => { if (error === "NOT_FOUND") setLocation("/404"); }, [error, setLocation]);

  if (error === "NOT_FOUND") return <NotFound />;
  return <SiteShell>
    {!match && !error && <div className="detail-loading"><div className="skeleton-detail" /></div>}
    {error && error !== "NOT_FOUND" && <div className="state-panel state-panel--error">تعذر تحميل تفاصيل المباراة. <button className="text-button" onClick={() => window.location.reload()}>إعادة المحاولة</button></div>}
    {match && <>
      <Link href="/matches" className="back-link"><ArrowRight size={16} /> العودة إلى مركز المباريات</Link>
      <section className="detail-hero"><div className="detail-hero__eyebrow"><span className={`status-pill status-pill--${match.status}`}>{match.status === "live" ? <Radio size={12} /> : <Clock3 size={12} />}{statusText(match)}</span><span>{match.competition.name}</span></div><p className="detail-hero__date"><CalendarDays size={15} />{formatFullDate(match.date)} · {match.kickoff}</p><div className="detail-scoreboard"><div className="detail-team"><span className="detail-badge" style={{ background: `linear-gradient(145deg, ${match.home.accent}, #111)` }}>{match.home.shortName.slice(0, 2)}</span><strong>{match.home.name}</strong><small>صاحب الأرض</small></div><div className="detail-score"><strong>{match.status === "scheduled" ? "– : –" : `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`}</strong><span>{match.status === "live" ? `${match.minute ?? 0}′ من اللعب` : match.stage}</span></div><div className="detail-team"><span className="detail-badge" style={{ background: `linear-gradient(145deg, ${match.away.accent}, #111)` }}>{match.away.shortName.slice(0, 2)}</span><strong>{match.away.name}</strong><small>الضيف</small></div></div></section>
      <section className="detail-info-grid"><div className="info-card"><span><MapPin size={16} /> الملعب</span><strong>{match.venue}</strong></div><div className="info-card"><span><Trophy size={16} /> البطولة</span><strong>{match.competition.name}</strong></div><div className="info-card"><span><ShieldCheck size={16} /> الحالة</span><strong>{match.note}</strong></div></section>
      <section className="timeline"><div className="section-heading"><div><span className="eyebrow"><span className="eyebrow__line" /> ملخص الحالة</span><h2>مؤشر المباراة</h2></div><span className="timeline__live">{match.status === "live" ? "تتحدث الآن" : "بيانات المباراة"}</span></div><div className="timeline__track"><span className="timeline__point timeline__point--start" /><span className={`timeline__fill timeline__fill--${match.status}`} style={{ width: match.status === "live" ? `${Math.min(((match.minute ?? 0) / 90) * 100, 100)}%` : match.status === "done" ? "100%" : "0%" }} /><span className="timeline__point timeline__point--end" /></div><div className="timeline__labels"><span>البداية<br /><b>{match.kickoff}</b></span><span>الآن<br /><b>{match.status === "live" ? `${match.minute}′` : match.status === "done" ? "النهاية" : "قبل البداية"}</b></span><span>النهاية<br /><b>{match.status === "scheduled" ? "—" : "90′"}</b></span></div></section>
    </>}
  </SiteShell>;
}
