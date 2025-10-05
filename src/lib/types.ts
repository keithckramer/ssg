export type Matchup = {
  id: string;
  home: string;
  away: string;
  kickoff: string;
};

export type Stick = {
  id: string;
  buyer: string;
  number: number;
  price: number;
  fee: number;
  createdAt: string;
};

export type Group = {
  id: string;
  sticks: Stick[];
};

export type OrdersMap = Record<string, Group[]>;

export type ResultsEntry = {
  homeScore: number;
  awayScore: number;
  digit: number;
} | null;

export type ResultsMap = Record<string, ResultsEntry>;

export type Config = {
  potPerStick: number;
};
