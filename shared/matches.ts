export type MatchStatus = "live" | "scheduled" | "done";

export type Team = {
  name: string;
  shortName: string;
  accent: string;
};

export type Match = {
  id: string;
  date: string;
  competition: {
    id: string;
    name: string;
    shortName: string;
  };
  home: Team;
  away: Team;
  kickoff: string;
  status: MatchStatus;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  stage: string;
  note: string;
};

export type MatchesQuery = {
  date?: string;
  status?: MatchStatus;
  competition?: string;
  q?: string;
};

export type MatchesResponse = {
  matches: Match[];
  dates: string[];
  competitions: Array<{ id: string; name: string; count: number }>;
  updatedAt: string;
  source: "demo" | "provider";
};
