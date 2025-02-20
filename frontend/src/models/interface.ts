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
