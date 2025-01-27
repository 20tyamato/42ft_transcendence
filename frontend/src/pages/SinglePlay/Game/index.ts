import { initGame, startGameLoop, resetGame, setAILevel, getFinalScore } from './logic';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlayPage = new Page({
  name: 'SinglePlay/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const selectedLevel = localStorage.getItem('selectedLevel');
    console.log(`Retrieved selected level: ${selectedLevel}`); // 取得値を確認
    const retryBtn = document.getElementById('retryBtn');
    const exitBtn = document.getElementById('exitBtn');

    if (selectedLevel) {
      setAILevel(Number(selectedLevel)); // 保存されたレベルを設定
      initGame();
      startGameLoop(() => {
        localStorage.setItem('finalScore', JSON.stringify(getFinalScore()));
        window.location.href = '/result';
      });
    } else {
      alert('No level selected. Returning to level selection.');
      window.location.href = '/singleplay/select'; // レベル選択ページに戻る
    }

    retryBtn?.addEventListener('click', () => {
      resetGame();
      window.location.reload();
    });

    exitBtn?.addEventListener('click', () => {
      window.location.href = '/singleplay/select';
    });
  },
});

export default SinglePlayPage;
