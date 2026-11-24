import type { Match, MatchStatus, MatchesQuery, MatchesResponse } from "@shared/matches";

export const STATUS_LABELS: Record<MatchStatus, string> = {
  live: "مباشر",
  scheduled: "قادمة",
  done: "منتهية",
};

export async function fetchMatches(query: MatchesQuery = {}): Promise<MatchesResponse> {
  const params = new URLSearchParams();
  if (query.date) params.set("date", query.date);
  if (query.status) params.set("status", query.status);
  if (query.competition) params.set("competition", query.competition);
  if (query.q) params.set("q", query.q);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/matches${suffix}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`تعذر تحميل المباريات (${response.status})`);
  return response.json() as Promise<MatchesResponse>;
}

export async function fetchMatch(id: string): Promise<Match> {
  const response = await fetch(`/api/matches/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("NOT_FOUND");
    throw new Error(`تعذر تحميل تفاصيل المباراة (${response.status})`);
  }
  return response.json() as Promise<Match>;
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("ar-EG", options).format(new Date(`${date}T12:00:00`));
}

export function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

export function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

export function isToday(date: string) {
  return date === new Date().toISOString().slice(0, 10);
}

export function statusText(match: Match) {
  if (match.status === "live") return match.minute ? `مباشر · ${match.minute}′` : "مباشر الآن";
  if (match.status === "done") return "انتهت";
  return `تبدأ ${match.kickoff}`;
}
