import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import Ball from './Ball';
import Experience from './Experience';
import Field from './Field';

let running = true; // ゲームの状態管理

// Pause メニューのセットアップ関数
export function setupPauseMenu() {
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeBtn = document.getElementById('resumeBtn');
  const retryBtn = document.getElementById('retryBtn');
  const exitBtn = document.getElementById('exitBtn');

  if (!pauseBtn || !pauseOverlay || !resumeBtn || !retryBtn || !exitBtn) {
    console.warn('Pause menu elements are missing.');
    return;
  }
  pauseBtn.addEventListener('click', () => {
    running = false;
    pauseOverlay.style.display = 'flex';
  });

  resumeBtn.addEventListener('click', () => {
    running = true;
    pauseOverlay.style.display = 'none';
  });

  retryBtn.addEventListener('click', () => {
    window.location.reload();
  });

  exitBtn.addEventListener('click', () => {
    window.location.href = '/singleplay/select';
  });
}

const SinglePlayPage = new Page({
  name: 'SinglePlay/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    // ヘッダーと背景を非表示にする
    const header = document.querySelector('.header');
    const background = document.getElementById('background');
    if (header) header.classList.add('none');
    if (background) background.classList.add('none');

    const username = localStorage.getItem('username') || 'Player';
    const playerNameDiv = document.getElementById('playerName');
    if (playerNameDiv) {
      // すでに HTML 内に「<span class="leftName">Player</span><span class="vs">VS</span><span class="rightName">CPU</span>」があると仮定
      const leftNameSpan = playerNameDiv.querySelector('.leftName');
      if (leftNameSpan) {
        leftNameSpan.textContent = username;
      }
    }

    const selectedLevel = localStorage.getItem('selectedLevel');
    console.log(`Retrieved selected level: ${selectedLevel}`);

    // Three.js の Experience を初期化
    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    const experience = Experience.getInstance(canvas);
    // ゲームループを開始
    function animate() {
      if (running) {
        experience.update();
      }
      requestAnimationFrame(animate);
    }
    animate();
    setupPauseMenu();

    // Before unload event
    window.addEventListener('beforeunload', () => experience.destroy());
  },
});

export default SinglePlayPage;
