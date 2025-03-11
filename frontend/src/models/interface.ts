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
// TODO: initプロパティ

// FIXME: RM???
export interface IBlockchainScore {
  txHash: string;
  score: number;
}
