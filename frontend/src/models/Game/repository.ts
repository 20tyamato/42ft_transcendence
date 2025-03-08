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
  const username = localStorage.getItem('username');

  const gameData = {
    status: 'COMPLETED',
    end_time: new Date().toISOString(),
    game_type: 'SINGLE',
    player1: username,
    player2: null,
    scorePlayer1: playerScore,
    score_player2: cpuScore,
    winner: playerScore > cpuScore ? username : null,
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
}: {
  player1Score: number;
  player2Score: number;
  opponentName: string;
}): Promise<boolean> => {
  const username = localStorage.getItem('username');

  const isWinner = player1Score > player2Score;
  const gameData = {
    status: 'COMPLETED',
    end_time: new Date().toISOString(),
    game_type: 'MULTI',
    player1: username,
    player2: opponentName,
    score_player1: player1Score,
    score_player2: player2Score,
    winner: isWinner ? username : opponentName,
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
    console.error('Error creating multiplayer game:', error);
    throw error;
  }
};

/**
 * トーナメントゲームを作成
 * @param playerScore プレイヤーのスコア
 * @returns ゲームデータ
 */
export const createTournamentGame = async ({
  playerScore,
}: {
  playerScore: number;
}): Promise<boolean> => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  const gameData = {
    status: 'COMPLETED',
    end_time: new Date().toISOString(),
    game_type: 'TOURNAMENT',
  };

  /** TODO: トーナメントゲームのデータを作成 */

  return true;
};
