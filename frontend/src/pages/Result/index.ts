import { API_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';

interface GameScore {
  player1: number;
  player2: number;
}

async function sendGameResult(score: GameScore) {
  try {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    const gameData = {
      player1: username,
      player2: null,
      score_player1: score.player1,
      score_player2: score.player2,
      is_ai_opponent: true,
      winner: score.player1 > score.player2 ? username : null,
      end_time: new Date().toISOString(),
    };

    const response = await fetch(`${API_URL}/api/games/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(gameData),
    });

    // デバッグ用のログを追加
    console.log('Request payload:', gameData);
    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (!response.ok) {
      throw new Error('Failed to save game result');
    }

    console.log('Game result saved successfully');
  } catch (error) {
    console.error('Error saving game result:', error);
  }
}

const ResultPage = new Page({
  name: 'Result',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    checkUserAccess();
    const storedScore = localStorage.getItem('finalScore');
    const gameMode = localStorage.getItem('gameMode');
    const username = localStorage.getItem('username');

    if (storedScore && gameMode === 'multiplayer') {
      const score = JSON.parse(storedScore);

      // スコアの表示を更新
      const playerScoreElement = document.getElementById('playerScore');
      const opponentScoreElement = document.getElementById('cpuScore');
      const resultMessage = document.getElementById('result-message');
      const playerNameElement = document.getElementById('playerName');
      const opponentNameElement = document.querySelector('.cpu-side .player-name');

      if (playerNameElement && username) {
        playerNameElement.textContent = username;
      }

      if (opponentNameElement && score.opponent) {
        opponentNameElement.textContent = score.opponent;
      }

      if (playerScoreElement) playerScoreElement.textContent = String(score.player1);
      if (opponentScoreElement) opponentScoreElement.textContent = String(score.player2);

      if (resultMessage) {
        if (score.player1 > score.player2) {
          resultMessage.textContent = 'You Win!';
          resultMessage.className = 'result-message win';
        } else {
          resultMessage.textContent = 'Opponent Wins!';
          resultMessage.className = 'result-message lose';
        }
      }

      // ストレージのクリア
      localStorage.removeItem('finalScore');
      localStorage.removeItem('gameMode');
    }

    const exitBtn = document.getElementById('exitBtn');
    exitBtn?.addEventListener('click', () => {
      window.location.href = '/modes';
    });
  },
});

export default ResultPage;
