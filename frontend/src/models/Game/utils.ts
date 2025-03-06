import { IGameMode, IGameResult } from './type';

/**
 * ゲームモードに基づいたAPIリクエストデータを構築
 * @param score ゲームスコア
 * @param gameMode ゲームモード
 * @param username ユーザー名
 * @returns ゲームデータ
 */
export const buildGameData = (score: IGameResult, gameMode: IGameMode, username: string): any => {
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
};
