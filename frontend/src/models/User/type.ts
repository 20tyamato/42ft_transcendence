// frontend/src/models/User/type.ts
import { languageNames } from '@/utils/language';

export interface IUser {
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  level: number;
  language: keyof typeof languageNames;
  is_online: boolean;
  total_matches: number; // 総試合数
  wins: number; // 勝利数
  losses: number; // 敗北数
  tournament_wins: number; // トーナメント優勝数
}

export interface IMatchHistory {
  id: number;
  date: string; // 試合日時（ISO形式の文字列）
  opponent: string; // 対戦相手の名前
  result: 'win' | 'lose'; // 試合結果
  match_type: string; // 試合タイプ（"Single", "Multi", "Tournament Match"）
  score_player1: number; // プレイヤー1のスコア
  score_player2: number; // プレイヤー2のスコア
  session_id: string; // セッションID
}

// マッチ履歴API応答型
export interface IMatchHistoryResponse {
  data: IMatchHistory[];
  error?: string;
}
