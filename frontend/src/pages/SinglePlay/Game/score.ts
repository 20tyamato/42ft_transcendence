const API_BASE_URL = '/api';

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
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

/**
 * スコアリーダーボードを取得するAPI
 */
export async function getLeaderboard(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/`);
    if (!response.ok) {
      console.error('Failed to fetch leaderboard:', await response.text());
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}
