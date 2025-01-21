const API_BASE_URL = '/api';

interface LeaderboardEntry {
  player: string;
  score: number;
}

/**
 * スコアを保存するAPI
 * @param player - プレイヤー名
 * @param score - スコア
 */
export async function saveScore(player: string, score: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/save-score/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player, score }),
    });

    if (!response.ok) {
      console.error('Failed to save score:', await response.text());
    } else {
      console.log('Score saved successfully');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error saving score:', error.message);
    } else {
      console.error('Unexpected error saving score');
    }
  }
}

/**
 * スコアリーダーボードを取得するAPI
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/`);
    if (!response.ok) {
      console.error('Failed to fetch leaderboard:', await response.text());
      return [];
    }
    return (await response.json()) as LeaderboardEntry[];
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching leaderboard:', error.message);
    } else {
      console.error('Unexpected error fetching leaderboard');
    }
    return [];
  }
}
