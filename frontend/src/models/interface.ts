// frontend/src/models/interface.ts
import { languageNames } from '@/utils/language';

// ===== User =====
export interface IFriend {
  id: number;
  username: string;
  is_online: boolean;
}

export interface IRankingUser {
  username: string;
  level: number;
}

// ===== Tournament =====
export interface ITournamentHistory {
  date: string;
  result: string;
}

export type ITournamentMatchStatus = 'pending' | 'in_progress' | 'completed';

export interface ITournamentMatch {
  id: string;
  round: number; // 0: 準決勝, 1: 決勝
  player1: string | null;
  player2: string | null;
  winner: string | null;
  status: ITournamentMatchStatus;
}

export interface ITournamentParticipant {
  id: number;
  username: string;
  display_name: string;
  is_ready: boolean;
  joined_at: string;
  bracket_position: number | null;
}

export interface ITournamentSession {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  max_players: number;
  current_players_count: number;
  participants: ITournamentParticipant[];
  // このトーナメントに関連するすべての試合（準決勝・決勝）のIDリスト
  games: number[];
  winner?: string; // 優勝者のユーザー名
  winner_display_name?: string; // 優勝者の表示名
}

export interface ITournamentResult {
  tournament_id: string;
  winner: string;
  winner_display_name: string;
  completed_at: string;
}

// FIXME: RM???
export interface IBlockchainScore {
  txHash: string;
  score: number;
}
