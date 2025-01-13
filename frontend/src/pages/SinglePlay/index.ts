import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlayPage = new Page({
  name: 'SinglePlay',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const aiLevelSelect = document.getElementById('aiLevelSelect') as HTMLSelectElement;
    const startGameBtn = document.getElementById('startGameBtn');
    const gameResult = document.getElementById('gameResult') as HTMLElement;
    const retryBtn = document.getElementById('retryBtn');
    const exitBtn = document.getElementById('exitBtn');

    startGameBtn?.addEventListener('click', () => {
      const selectedLevel = aiLevelSelect.value;
      alert(`Game started with AI level: ${selectedLevel}`);
      // ログインしているかチェック (本来はログイン必須)
      // 実際のゲームロジックを実行

      // 終了時に画面を表示
      gameResult.classList.remove('hidden');
    });

    retryBtn?.addEventListener('click', () => {
      window.location.reload();
    });

    exitBtn?.addEventListener('click', () => {
      window.location.href = '/opening'; // オープニングへ戻る
    });
  },
});

export default SinglePlayPage;
