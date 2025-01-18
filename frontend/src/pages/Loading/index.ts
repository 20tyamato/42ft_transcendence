import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const LoadingPage = new Page({
  name: 'Loading',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const singleModeButton = document.querySelector('.single-mode') as HTMLButtonElement | null;
    const multiModeButton = document.querySelector('.multi-mode') as HTMLButtonElement | null;
    const tournamentModeButton = document.querySelector('.tournament-mode') as HTMLButtonElement | null;

    const loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement | null;
    const countdownDisplay = document.getElementById('countdown') as HTMLSpanElement | null;

    function showLoadingScreen(targetPath: string) {
      if (!loadingOverlay || !countdownDisplay) return;

      // オーバーレイ表示
      loadingOverlay.classList.remove('hidden');

      let remaining = 10; // 秒数

      // カウントダウン初期値
      countdownDisplay.textContent = remaining.toString();

      // 1秒ごとにカウントダウン
      const intervalId = setInterval(() => {
        remaining -= 1;
        countdownDisplay.textContent = remaining.toString();

        // 0になったらページ遷移
        if (remaining <= 0) {
          clearInterval(intervalId);
          window.location.href = targetPath;
        }
      }, 1000);
    }

    singleModeButton?.addEventListener('click', () => {
      console.log('Navigating to /singleplay/select');
      showLoadingScreen('/singleplay/select');
    });

    multiModeButton?.addEventListener('click', () => {
      console.log('Navigating to /multiplay');
      showLoadingScreen('/multiplay');
    });

    tournamentModeButton?.addEventListener('click', () => {
      console.log('Navigating to /tournaments');
      showLoadingScreen('/tournaments');
    });
  },
});

export default LoadingPage;
