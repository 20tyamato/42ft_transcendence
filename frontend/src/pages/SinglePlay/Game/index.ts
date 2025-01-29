import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import {
  getFinalScore,
  initGame,
  resetGame,
  setAILevel,
  // togglePause,
  setupPauseMenu,
  startGameLoop,
} from './logic';

const SinglePlayPage = new Page({
  name: 'SinglePlay/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const selectedLevel = localStorage.getItem('selectedLevel');
    console.log(`Retrieved selected level: ${selectedLevel}`); // 取得値を確認
    const retryBtn = document.getElementById('retryBtn') as HTMLButtonElement;
    const exitBtn = document.getElementById('exitBtn') as HTMLButtonElement;
    const resumeBtn = document.getElementById('resumeBtn') as HTMLButtonElement;
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
    const pauseOverlay = document.getElementById('pauseOverlay') as HTMLDivElement;

    if (selectedLevel) {
      setAILevel(Number(selectedLevel));
      initGame();
      startGameLoop(() => {
        localStorage.setItem('finalScore', JSON.stringify(getFinalScore()));
        window.location.href = '/result';
      });
    } else {
      alert('No level selected. Returning to level selection.');
      window.location.href = '/singleplay/select';
    }
    setupPauseMenu();

    retryBtn?.addEventListener('click', () => {
      resetGame();
      window.location.reload();
    });

    exitBtn?.addEventListener('click', () => {
      window.location.href = '/singleplay/select';
    });

    resumeBtn?.addEventListener('click', () => {
      pauseOverlay.classList.add('hidden');
      // ゲームを再開するロジックを追加
    });

    pauseBtn?.addEventListener('click', () => {
      pauseOverlay.classList.remove('hidden');
      // ゲームを一時停止するロジックを追加
    });
  },
});

export default SinglePlayPage;
