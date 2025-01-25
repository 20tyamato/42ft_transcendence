import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

interface GameScore {
  player1: number;
  player2: number;
}

async function sendGameResult(score: GameScore) {
  try {
    // ローカルストレージからユーザー情報を取得
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
      console.error('User not authenticated');
      return;
    }

    const gameData = {
      player1: username,
      player2: null,
      score_player1: score.player1,
      score_player2: score.player2,
      is_ai_opponent: true,
      winner: score.player1 > score.player2 ? username : null,
      end_time: new Date().toISOString(),
    };

    const response = await fetch('http://127.0.0.1:8000/api/games/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
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
    const storedScore = localStorage.getItem('finalScore');
    const difficulty = localStorage.getItem('selectedLevel');
    const username = localStorage.getItem('username');

    if (storedScore && difficulty) {
      const score = JSON.parse(storedScore);

      // スコアの表示を更新
      const playerScoreElement = document.getElementById('playerScore');
      const cpuScoreElement = document.getElementById('cpuScore');
      const resultMessage = document.getElementById('result-message');
      const playerNameElement = document.getElementById('playerName');

      // プレイヤー名の表示を更新
      if (playerNameElement && username) {
        playerNameElement.textContent = username;
      }

      if (playerScoreElement) playerScoreElement.textContent = String(score.player1);
      if (cpuScoreElement) cpuScoreElement.textContent = String(score.player2);

      // 勝敗メッセージの設定
      if (resultMessage) {
        if (score.player1 > score.player2) {
          resultMessage.textContent = 'You Win!';
          resultMessage.className = 'result-message win';
        } else {
          resultMessage.textContent = 'CPU Wins!';
          resultMessage.className = 'result-message lose';
        }
      }

      // 結果をバックエンドに送信
      await sendGameResult(score, Number(difficulty));

      // スコアをクリア
      localStorage.removeItem('finalScore');
    }

    const exitBtn = document.getElementById('exitBtn');
    exitBtn?.addEventListener('click', () => {
      window.location.href = '/modes';
    });
  },
});

export default ResultPage;
