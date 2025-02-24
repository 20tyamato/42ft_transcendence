import { API_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { IGameScore } from '@/models/interface';
import { checkUserAccess } from '@/models/User/auth';
import { fetchUserAvatar } from '@/models/User/repository';

async function sendGameResult(score: IGameScore) {
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
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
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
      console.log(username);
      console.log(score.opponent);

      const playerAvatarImg = document.getElementById('player-avatar') as HTMLImageElement;
      const opponentAvatarImg = document.getElementById('opponent-avatar') as HTMLImageElement;
      if (playerAvatarImg && opponentAvatarImg && username) {
        fetchUserAvatar(username).then((avatar) => {
          if (avatar && avatar.type.startsWith('image/')) {
            const avatarUrl = URL.createObjectURL(avatar);
            playerAvatarImg.src = avatarUrl;
          } else {
            playerAvatarImg.src = `${API_URL}/media/default_avatar.png`;
          }
        });
        playerAvatarImg.alt = username;
        fetchUserAvatar(score.opponent).then((avatar) => {
          if (avatar && avatar.type.startsWith('image/')) {
            const avatarUrl = URL.createObjectURL(avatar);
            opponentAvatarImg.src = avatarUrl;
          } else {
            opponentAvatarImg.src = `${API_URL}/media/default_avatar.png`;
          }
        });
        opponentAvatarImg.alt = score.opponent;
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

      // 結果をバックエンドに送信
      await sendGameResult(score);

      // スコアをクリア
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
