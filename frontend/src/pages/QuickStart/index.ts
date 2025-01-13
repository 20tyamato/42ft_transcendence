import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const QuickStartPage = new Page({
  name: 'QuickStart',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const startGameBtn = document.getElementById('startGameBtn');
    const gameResult = document.getElementById('gameResult') as HTMLElement;
    const retryBtn = document.getElementById('retryBtn');
    const exitBtn = document.getElementById('exitBtn');

    startGameBtn?.addEventListener('click', () => {
      alert('Game Started! Playing up to 5 points...');
      // ここでゲーム開始のロジックを実行 (実際はCanvasやWebSocketなど)
      // 終了したタイミングで下記のように gameResult を表示
      gameResult.classList.remove('hidden');
    });

    retryBtn?.addEventListener('click', () => {
      alert('Retrying Quick Start Game...');
      window.location.reload();
    });

    exitBtn?.addEventListener('click', () => {
      alert('Exit Quick Start Game...');
      window.location.href = '/opening'; // Opening画面へ戻る
    });
  },
});

export default QuickStartPage;
