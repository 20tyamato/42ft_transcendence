// frontend/src/types/tournament.d.ts

export interface Tournament {
  id: number;
  name: string;
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  participants: string[];
}

export interface TournamentMatch {
  id: number;
  round: number;
  match_number: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  scores: {
    player1: number;
    player2: number;
  };
}

export interface TournamentState {
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  current_round: number;
  participants: string[];
  matches: TournamentMatch[];
}
