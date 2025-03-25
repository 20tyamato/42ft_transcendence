import { logger } from '@/core/Logger';
import { ICurrentUser, useCurrentUser } from '@/libs/Auth/currentUser';
import { fetcher } from '@/utils/fetcher';

/**
 * シングルプレイゲームを作成
 * @param playerScore プレイヤーのスコア
 * @param cpuScore CPUのスコア
 * @returns ゲームデータ
 */
export const createSinglePlayGame = async ({
  playerScore,
  cpuScore,
  aiLevel,
}: {
  playerScore: number;
  cpuScore: number;
  aiLevel: number;
}): Promise<boolean> => {
  const currentUser = await useCurrentUser();

  const gameData = {
    status: 'COMPLETED',
    end_time: new Date().toISOString(),
    game_type: 'SINGLE',
    player1: currentUser.username,
    player2: null,
    score_player1: playerScore,
    score_player2: cpuScore,
    winner: playerScore > cpuScore ? currentUser.username : null,
    ai_level: aiLevel,
  };

  const response = await fetcher('/api/games/', {
    method: 'POST',
    body: gameData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return true;
};

/**
 * マルチプレイゲームを作成
 * @param player1Score プレイヤー1のスコア
 * @param player2Score プレイヤー2のスコア
 * @param opponentName 相手の名前
 * @returns ゲームデータ
 */
export const createMultiplayerGame = async ({
  player1Score,
  player2Score,
  opponentName,
  currentUser,
}: {
  player1Score: number;
  player2Score: number;
  opponentName: string;
  currentUser: ICurrentUser;
}): Promise<boolean> => {
  const isWinner = player1Score > player2Score;
  const gameData = {
    status: 'COMPLETED',
    end_time: new Date().toISOString(),
    game_type: 'MULTI',
    player1: currentUser.username,
    player2: opponentName,
    score_player1: player1Score,
    score_player2: player2Score,
    winner: isWinner ? currentUser.username : opponentName,
  };

  try {
    const { ok } = await fetcher('/api/games/', {
      method: 'POST',
      body: gameData,
    });

    if (!ok) {
      throw new Error('Failed to create multiplayer game');
    }

    return true;
  } catch (error) {
    logger.error('Error creating multiplayer game:', error);
    throw error;
  }
};

/**
 * トーナメントゲームを作成
 * @returns ゲームデータ
 */
export const createTournamentGame = async (): Promise<boolean> => {
  /** TODO: トーナメントゲームのデータを作成 */

  return true;
};
