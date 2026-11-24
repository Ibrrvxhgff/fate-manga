import { AlertCircle, ChevronLeft, Filter, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import type { Match, MatchStatus, MatchesResponse } from "@shared/matches";
import { fetchMatches, formatDate, formatUpdatedAt, isToday, STATUS_LABELS } from "@/lib/matches";
import MatchCard from "@/components/MatchCard";

type Mode = "home" | "full";

function groupByCompetition(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((groups, match) => { (groups[match.competition.name] ??= []).push(match); return groups; }, {});
}

export default function MatchesView({ mode }: { mode: Mode }) {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(params.get("date") ?? "");
  const [status, setStatus] = useState<MatchStatus | "all">((params.get("status") as MatchStatus | "all") || "all");
  const [competition, setCompetition] = useState(params.get("competition") ?? "all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setData(await fetchMatches()); setError(false); } catch { setError(true); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); const timer = window.setInterval(load, 60_000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { if (!selectedDate && data?.dates.length) setSelectedDate(data.dates.find(isToday) ?? data.dates[0]); }, [data?.dates, selectedDate]);

  const dates = data?.dates ?? [];
  const selected = selectedDate || dates[0] || "";
  const visibleMatches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ar");
    return (data?.matches ?? []).filter(match => {
      if (selected && match.date !== selected) return false;
      if (status !== "all" && match.status !== status) return false;
      if (competition !== "all" && match.competition.id !== competition) return false;
      if (q && !`${match.home.name} ${match.away.name} ${match.competition.name}`.toLocaleLowerCase("ar").includes(q)) return false;
      return true;
    });
  }, [competition, data?.matches, query, selected, status]);
  const liveCount = data?.matches.filter(match => match.status === "live").length ?? 0;
  const groups = groupByCompetition(mode === "home" ? visibleMatches.slice(0, 5) : visibleMatches);

  return <section className={`matches-section ${mode === "full" ? "matches-section--full" : ""}`}>
    <div className="section-heading"><div><span className="eyebrow"><span className="eyebrow__line" /> {mode === "home" ? "على الموعد" : "مركز المباريات"}</span><h2>{mode === "home" ? "مباريات اليوم" : "الجدول الكامل"}</h2><p>{mode === "home" ? "كل ما يحدث الآن وما سيبدأ بعد قليل." : "ابحث، صفِّ، واختر اليوم الذي تريد متابعته."}</p></div>{mode === "home" ? <Link className="section-heading__link" href="/matches">عرض الكل <ChevronLeft size={15} /></Link> : <div className="live-summary"><span className="live-dot" /> {liveCount} مباشر الآن</div>}</div>
    {mode === "full" && <div className="filters"><label className="search-box"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن فريق أو بطولة" aria-label="البحث عن فريق أو بطولة" /></label><label className="select-box"><Filter size={16} /><select value={competition} onChange={event => setCompetition(event.target.value)} aria-label="اختيار البطولة"><option value="all">كل البطولات</option>{data?.competitions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button type="button" className={`refresh-button ${refreshing ? "is-loading" : ""}`} onClick={load} disabled={refreshing}><RefreshCw size={17} />{refreshing ? "يحدث…" : "تحديث"}</button></div>}
    {mode === "full" && <div className="status-tabs" role="tablist" aria-label="فلترة حالة المباراة">{(["all", "live", "scheduled", "done"] as const).map(value => <button key={value} type="button" className={status === value ? "is-active" : ""} onClick={() => setStatus(value)}>{value === "all" ? "الكل" : STATUS_LABELS[value]}</button>)}</div>}
    <div className="date-strip" aria-label="اختيار التاريخ">{dates.map(date => <button key={date} type="button" className={date === selected ? "is-active" : ""} onClick={() => setSelectedDate(date)}><strong>{formatDate(date)}</strong><small>{isToday(date) ? "اليوم" : date.slice(5).replace("-", "/")}</small></button>)}</div>
    {error && <div className="state-panel state-panel--error"><AlertCircle size={20} /> تعذر الاتصال بالمصدر. <button type="button" className="text-button" onClick={load}>إعادة المحاولة</button></div>}
    {loading && !data && <div className="matches-list"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
    {!loading && !error && visibleMatches.length === 0 && <div className="state-panel"><Search size={22} /><strong>لا توجد مباريات مطابقة</strong><span>جرّب تاريخًا أو فلترًا مختلفًا.</span></div>}
    {data && visibleMatches.length > 0 && <div className="matches-list">{Object.entries(groups).map(([name, items]) => <div className="competition-group" key={name}><div className="competition-group__head"><span className="competition-group__title"><span className="competition-mini-icon">✦</span>{name}</span><span>{items.length} مباريات</span></div><div className="match-grid">{items.map(match => <MatchCard key={match.id} match={match} compact={mode === "home"} />)}</div></div>)}</div>}
    {mode === "home" && <div className="matches-section__footer"><span>{liveCount > 0 ? "هناك مباريات تتحرك الآن" : "الجدول محدث"} · آخر تحديث {data ? formatUpdatedAt(data.updatedAt) : "—"}</span><Link href="/matches">فتح مركز المباريات <ChevronLeft size={15} /></Link></div>}
    {mode === "full" && data && <div className="matches-footer-note">المصدر الحالي: بيانات تجريبية منظمة · آخر تحديث {formatUpdatedAt(data.updatedAt)} · التحديث التلقائي كل 60 ثانية</div>}
  </section>;
}
