// src/types/hockey.ts
export interface MoneyPuckPlayerStats {
  playerId: number;
  season: number;
  name: string;
  team: string;
  position: string;
  situation: string;
  games: number;
  icetime: number;
  xGoals: number;
  xAssists: number;
  xPoints: number;
  goals: number;
  assists: number;
  points: number;
  shots: number;
  corsiFor: number;
  corsiAgainst: number;
  corsiForPct: number;
  fenwickFor: number;
  fenwickAgainst: number;
  fenwickForPct: number;
}

export interface MoneyPuckTeamStats {
  team: string;
  name: string;
  season: number;
  situation: string;
  games: number;
  corsiForPct: number;
  fenwickForPct: number;
  xGoalsForPct: number;
  xGoalsFor: number;
  xGoalsAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
  shotsForPct: number;
  reboundsForPct: number;
  penaltyMinutesFor: number;
  penaltyMinutesAgainst: number;
  faceoffsWonFor: number;
  hitsFor: number;
  takeawaysFor: number;
  giveawaysFor: number;
}