// src/models/Result/GameResultService.ts

import { API_URL } from '@/config/config';
import { IGameResult, IGameMode } from '@/models/interface';

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
      console.error('Failed to parse stored score:', error);
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
   * ゲームモードに基づいたAPIリクエストデータを構築
   */
  static buildGameData(score: IGameResult, gameMode: IGameMode, username: string): any {
    // 基本データ構造
    const baseData = {
      status: 'COMPLETED',
      end_time: new Date().toISOString(),
    };

    // ゲームモード別データ構築
    if (gameMode === 'singleplayer') {
      return {
        ...baseData,
        game_type: 'SINGLE',
        player1: username,
        player2: null,
        score_player1: score.player1,
        score_player2: score.player2,
        is_ai_opponent: true,
        winner: score.player1 > score.player2 ? username : null,
      };
    }

    if (gameMode === 'multiplayer') {
      const isWinner = score.player1 > score.player2;
      const gameData = {
        ...baseData,
        game_type: 'MULTI',
        player1: username,
        player2: score.opponent,
        score_player1: score.player1,
        score_player2: score.player2,
        is_ai_opponent: false,
        winner: isWinner ? username : score.opponent,
      };

      // 切断情報処理
      if (score.disconnected) {
        gameData.winner = score.disconnectedPlayer === username ? score.opponent : username;
      }

      return gameData;
    }

    if (gameMode === 'tournament') {
      // TODO: トーナメントモード用データ構築
      return {
        ...baseData,
        game_type: 'TOURNAMENT',
        // 他のトーナメント固有フィールド
      };
    }

    return baseData;
  }

  /**
   * ゲーム結果をバックエンドに送信
   */
  static async sendGameResult(score: IGameResult, gameMode: IGameMode): Promise<boolean> {
    try {
      // シングルプレイヤーモードのみバックエンドAPIを使用して保存
      // マルチプレイヤーとトーナメントはWebSocketで既に保存済み
      if (gameMode !== 'singleplayer') {
        console.log(`Skipping API call for ${gameMode} mode - already saved via WebSocket`);
        return true;
      }

      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');

      if (!token || !username) {
        console.error('Authentication data missing');
        return false;
      }

      const gameData = this.buildGameData(score, gameMode, username);

      const response = await fetch(`${API_URL}/api/games/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(gameData),
      });

      // デバッグログ
      console.log('Request payload:', gameData);
      console.log('Response status:', response.status);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      console.log('Game result saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving game result:', error);
      return false;
    }
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
          message: 'You Disconnected - Opponent Wins',
          className: 'result-message lose',
        };
      } else {
        return {
          isWinner: true,
          message: 'Opponent Disconnected - You Win!',
          className: 'result-message win',
        };
      }
    }

    // 通常スコアによる勝敗
    if (score.player1 > score.player2) {
      return {
        isWinner: true,
        message: 'You Win!',
        className: 'result-message win',
      };
    } else if (score.player1 < score.player2) {
      return {
        isWinner: false,
        message: 'Opponent Wins!',
        className: 'result-message lose',
      };
    } else {
      return {
        isWinner: false,
        message: 'Draw!',
        className: 'result-message draw',
      };
    }
  }
}
