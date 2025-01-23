import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const ResultPage = new Page({
  name: 'Result',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    // スコアの取得と表示
    const storedScore = localStorage.getItem('finalScore');
    if (storedScore) {
      const score = JSON.parse(storedScore);
      
      // スコアの表示を更新
      const playerScoreElement = document.getElementById('playerScore');
      const cpuScoreElement = document.getElementById('cpuScore');
      const resultMessage = document.getElementById('result-message');
      
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

      // スコアをクリア
      localStorage.removeItem('finalScore');
    }

    // exitボタンのイベントリスナー
    const exitBtn = document.getElementById('exitBtn');
    exitBtn?.addEventListener('click', () => {
      window.location.href = '/modes';  // モード選択画面へ移動
    });
  },
});

export default ResultPage;