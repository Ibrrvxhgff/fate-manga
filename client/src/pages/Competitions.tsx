import { ArrowLeft, CalendarDays, CircleDot, Trophy } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { fetchMatches } from "@/lib/matches";
import type { MatchesResponse } from "@shared/matches";
import { useEffect, useState } from "react";

export default function Competitions() {
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { fetchMatches().then(setData).catch(() => setError(true)); }, []);

  return <SiteShell>
    <section className="page-heading"><div><span className="eyebrow"><span className="eyebrow__line" /> البطولات</span><h1>كل المسابقات في لقطة واحدة</h1><p>اختر بطولة للانتقال مباشرة إلى مبارياتها ونتائجها.</p></div><div className="heading-mark"><Trophy size={24} /></div></section>
    {error ? <div className="state-panel state-panel--error"><CircleDot size={22} /> تعذر تحميل قائمة البطولات. حاول تحديث الصفحة.</div> : !data ? <div className="competition-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div> : <div className="competition-grid">{data.competitions.map(competition => {
      const matches = data.matches.filter(match => match.competition.id === competition.id);
      const live = matches.filter(match => match.status === "live").length;
      const done = matches.filter(match => match.status === "done").length;
      return <Link key={competition.id} href={`/matches?competition=${competition.id}`} className="competition-card"><div className="competition-card__top"><span className="competition-card__icon"><Trophy size={18} /></span><span className="competition-card__count">{competition.count} مباريات</span></div><h2>{competition.name}</h2><div className="competition-card__stats"><span><i className="legend-dot legend-dot--live" />{live} مباشر</span><span><i className="legend-dot legend-dot--done" />{done} منتهية</span></div><div className="competition-card__link">عرض الجدول <ArrowLeft size={15} /></div></Link>;
    })}</div>}
    <div className="data-note"><CalendarDays size={16} /><span>الأرقام المعروضة من مصدر تجريبي منظم ويمكن استبداله بمصدر رسمي مصرح به لاحقًا.</span></div>
  </SiteShell>;
}
