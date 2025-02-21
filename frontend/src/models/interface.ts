import { languageNames } from '@/utils/language';

export interface IFriend {
  id: number;
  username: string;
  is_online: boolean;
}

export interface IUserData {
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  level: number;
  experience: number;
  language: keyof typeof languageNames;
  is_online: boolean;
}

export interface IRankingUser {
  username: string;
  level: number;
}

export interface ITournamentHistory {
  date: string;
  result: string;
}

export interface IBlockchainScore {
  txHash: string;
  score: number;
}

export interface IGameScore {
  player1: number;
  player2: number;
}

export interface ITournamentState {
  sessionId: string;
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  participants: Array<{
    username: string;
    displayName: string;
    isReady?: boolean;
  }>;
  currentRound: number;
}

export type TournamentMatchStatus = 'pending' | 'in_progress' | 'completed';

export interface ITournamentMatch {
  id: string;
  round: number; // 0: 準決勝, 1: 決勝
  player1: string | null;
  player2: string | null;
  winner: string | null;
  status: TournamentMatchStatus;
}

export interface ITournamentBracket {
  matches: ITournamentMatch[];
}

export interface ITournamentReadyState extends ITournamentState {
  countdown?: number; // カウントダウンタイマー用
  timeoutAt?: string; // Ready待ち時間の期限
}
