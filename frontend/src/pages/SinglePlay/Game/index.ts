import gsap from 'gsap';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import Ball from './Ball';
import Experience from './Experience';
import Field from './Field';
import { createParticleCustomizationPanel } from './CustomParticle';

let running = true; // ゲームの状態管理

// Pause メニューのセットアップ関数
export function setupPauseMenu() {
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeBtn = document.getElementById('resumeBtn');
  const pauseRetryBtn = document.getElementById('pauseRetryBtn');
  const pauseExitBtn = document.getElementById('pauseExitBtn');

  if (!pauseBtn || !pauseOverlay || !resumeBtn || !pauseRetryBtn || !pauseExitBtn) {
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

  pauseRetryBtn.addEventListener('click', () => {
    window.location.reload();
  });

  pauseExitBtn.addEventListener('click', () => {
    window.location.href = '/singleplay/select';
  });
}

export function hideGameStartOverlay() {
  const overlay = document.getElementById('gameStartOverlay');
  if (!overlay) return;
  console.log('Starting fade-out animation for GAME START overlay');
  gsap.to(overlay, {
    duration: 1.5, // 2秒かけてフェードアウト
    opacity: 0.5,
    delay: 2, // 2秒後に開始
    onComplete: () => {
      console.log('Fade-out complete. Hiding overlay.');
      overlay.classList.add('hidden'); // CSSで非表示にする
    },
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
      const leftNameSpan = playerNameDiv.querySelector('.leftName');
      if (leftNameSpan) {
        leftNameSpan.textContent = username;
      }
    }

    const selectedLevel = localStorage.getItem('selectedLevel');
    console.log(`Retrieved selected level: ${selectedLevel}`);

    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    const experience = Experience.getInstance(canvas);

    const particlePanel = createParticleCustomizationPanel();
    document.body.appendChild(particlePanel);

    function animate() {
      if (running) {
        experience.update();
      }
      requestAnimationFrame(animate);
    }
    animate();
    setupPauseMenu();
    hideGameStartOverlay();

    window.addEventListener('beforeunload', () => experience.destroy());
  },
});

export default SinglePlayPage;
