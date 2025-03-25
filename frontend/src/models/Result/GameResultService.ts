// src/models/Result/GameResultService.ts
import i18next from '@/config/i18n';
import { logger } from '@/core/Logger';
import { IGameMode, IGameResult } from '../Game/type';

/**
 * ゲーム結果に関するサービスクラス
 * バックエンドとの通信とゲーム結果データの管理を担当
 */
export class GameResultService {
  /**
   * ローカルストレージからゲーム結果を取得
   */
  static getStoredResult(): { score: IGameResult; gameMode: IGameMode } | null {
    const storedScore = localStorage.getItem('finalScore');
    const gameMode = (localStorage.getItem('gameMode') as IGameMode) || 'singleplayer';

    if (!storedScore) return null;

    try {
      const score = JSON.parse(storedScore);
      return { score, gameMode };
    } catch (error) {
      logger.error('Failed to parse stored score:', error);
      return null;
    }
  }

  /**
   * ローカルストレージからゲーム結果をクリア
   */
  static clearStoredResult(): void {
    localStorage.removeItem('finalScore');
    localStorage.removeItem('gameMode');
  }

  /**
   * 勝者を判定
   */
  static determineWinner(
    score: IGameResult,
    username: string
  ): {
    isWinner: boolean;
    message: string;
    className: string;
  } {
    // 切断による勝敗
    if (score.disconnected) {
      const wasDisconnected = score.disconnectedPlayer === username;
      if (wasDisconnected) {
        return {
          isWinner: false,
          message: i18next.t('gameResult.disconnected.self'),
          className: 'result-message lose',
        };
      } else {
        return {
          isWinner: true,
          message: i18next.t('gameResult.disconnected.opponent'),
          className: 'result-message win',
        };
      }
    }

    // 通常スコアによる勝敗
    if (score.player1 > score.player2) {
      return {
        isWinner: true,
        message: i18next.t('gameResult.win'),
        className: 'result-message win',
      };
    } else if (score.player1 < score.player2) {
      return {
        isWinner: false,
        message: i18next.t('gameResult.lose'),
        className: 'result-message lose',
      };
    } else {
      return {
        isWinner: false,
        message: i18next.t('gameResult.draw'),
        className: 'result-message draw',
      };
    }
  }
}
