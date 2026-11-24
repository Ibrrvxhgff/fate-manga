import type { Match, MatchesQuery } from "@shared/matches";

const dateFor = (offset: number) => {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const TODAY = dateFor(0);
const TOMORROW = dateFor(1);
const AFTER_TOMORROW = dateFor(2);
const YESTERDAY = dateFor(-1);

const team = (name: string, shortName: string, accent: string) => ({ name, shortName, accent });

export const demoMatches: Match[] = [
  {
    id: "m-1001",
    date: TODAY,
    competition: { id: "egy-premier", name: "الدوري المصري الممتاز", shortName: "مصر" },
    home: team("الأهلي", "الأهلي", "#e21d48"),
    away: team("بيراميدز", "بيراميدز", "#43a3ff"),
    kickoff: "18:00",
    status: "live",
    minute: 68,
    homeScore: 2,
    awayScore: 1,
    venue: "استاد القاهرة الدولي",
    stage: "الجولة 12",
    note: "المباراة مستمرة — تحديث تلقائي كل دقيقة",
  },
  {
    id: "m-1002",
    date: TODAY,
    competition: { id: "premier-league", name: "الدوري الإنجليزي الممتاز", shortName: "إنجلترا" },
    home: team("ليفربول", "ليفربول", "#d71920"),
    away: team("تشيلسي", "تشيلسي", "#1261a0"),
    kickoff: "20:30",
    status: "scheduled",
    venue: "أنفيلد",
    stage: "الجولة 14",
    note: "تبدأ بعد قليل",
  },
  {
    id: "m-1003",
    date: TODAY,
    competition: { id: "la-liga", name: "الدوري الإسباني", shortName: "إسبانيا" },
    home: team("ريال مدريد", "ريال", "#f3f3f3"),
    away: team("إشبيلية", "إشبيلية", "#d31d32"),
    kickoff: "22:00",
    status: "scheduled",
    venue: "سانتياغو برنابيو",
    stage: "الجولة 15",
    note: "موعد المباراة 22:00 بتوقيت القاهرة",
  },
  {
    id: "m-1004",
    date: TODAY,
    competition: { id: "ucl", name: "دوري أبطال أوروبا", shortName: "أوروبا" },
    home: team("برشلونة", "برشلونة", "#9b1838"),
    away: team("إنتر ميلان", "إنتر", "#1464a5"),
    kickoff: "22:00",
    status: "scheduled",
    venue: "مونتجويك",
    stage: "دور المجموعات",
    note: "قمة أوروبية منتظرة",
  },
  {
    id: "m-1005",
    date: TODAY,
    competition: { id: "saudi-pro", name: "دوري روشن السعودي", shortName: "السعودية" },
    home: team("الهلال", "الهلال", "#2f66d0"),
    away: team("الاتحاد", "الاتحاد", "#f5c400"),
    kickoff: "17:15",
    status: "done",
    homeScore: 3,
    awayScore: 2,
    venue: "المملكة أرينا",
    stage: "الجولة 10",
    note: "انتهت المباراة",
  },
  {
    id: "m-1006",
    date: TODAY,
    competition: { id: "egy-premier", name: "الدوري المصري الممتاز", shortName: "مصر" },
    home: team("الزمالك", "الزمالك", "#f4f4f4"),
    away: team("المصري", "المصري", "#20a978"),
    kickoff: "15:00",
    status: "done",
    homeScore: 1,
    awayScore: 1,
    venue: "استاد برج العرب",
    stage: "الجولة 12",
    note: "نهاية المباراة بالتعادل",
  },
  {
    id: "m-1007",
    date: TOMORROW,
    competition: { id: "bundesliga", name: "الدوري الألماني", shortName: "ألمانيا" },
    home: team("بايرن ميونخ", "بايرن", "#d51c2c"),
    away: team("دورتموند", "دورتموند", "#f0cf00"),
    kickoff: "19:30",
    status: "scheduled",
    venue: "أليانز أرينا",
    stage: "الجولة 13",
    note: "كلاسيكو ألمانيا",
  },
  {
    id: "m-1008",
    date: TOMORROW,
    competition: { id: "premier-league", name: "الدوري الإنجليزي الممتاز", shortName: "إنجلترا" },
    home: team("مانشستر سيتي", "السيتي", "#6cadde"),
    away: team("أرسنال", "أرسنال", "#e61f2d"),
    kickoff: "22:00",
    status: "scheduled",
    venue: "الاتحاد",
    stage: "الجولة 14",
    note: "قمة الجولة",
  },
  {
    id: "m-1009",
    date: AFTER_TOMORROW,
    competition: { id: "ucl", name: "دوري أبطال أوروبا", shortName: "أوروبا" },
    home: team("باريس سان جيرمان", "باريس", "#1c4b9b"),
    away: team("ميلان", "ميلان", "#bf132b"),
    kickoff: "21:00",
    status: "scheduled",
    venue: "بارك دي برانس",
    stage: "الجولة الخامسة",
    note: "حجز المقاعد متاح",
  },
  {
    id: "m-1010",
    date: YESTERDAY,
    competition: { id: "saudi-pro", name: "دوري روشن السعودي", shortName: "السعودية" },
    home: team("النصر", "النصر", "#e7c343"),
    away: team("الأهلي", "الأهلي", "#1b7e68"),
    kickoff: "20:00",
    status: "done",
    homeScore: 2,
    awayScore: 0,
    venue: "الأول بارك",
    stage: "الجولة 10",
    note: "انتهت المباراة",
  },
];

const validDate = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);

export function getMatches(query: MatchesQuery = {}) {
  const q = query.q?.trim().toLocaleLowerCase("ar") ?? "";
  return demoMatches.filter(match => {
    if (validDate(query.date) && match.date !== query.date) return false;
    if (query.status && match.status !== query.status) return false;
    if (query.competition && match.competition.id !== query.competition) return false;
    if (q) {
      const haystack = `${match.home.name} ${match.away.name} ${match.competition.name}`.toLocaleLowerCase("ar");
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getMatchById(id: string) {
  return demoMatches.find(match => match.id === id);
}

export function getDates() {
  return [...new Set(demoMatches.map(match => match.date))].sort();
}

export function getCompetitionSummary() {
  const counts = new Map<string, { id: string; name: string; count: number }>();
  for (const match of demoMatches) {
    const current = counts.get(match.competition.id) ?? { id: match.competition.id, name: match.competition.name, count: 0 };
    current.count += 1;
    counts.set(match.competition.id, current);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ar"));
}
