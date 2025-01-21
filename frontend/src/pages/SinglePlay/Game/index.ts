import { initGame, startGameLoop, resetGame, setAILevel } from './logic';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlayPage = new Page({
  name: 'SinglePlay/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const params = new URLSearchParams(window.location.search);
    const level = params.get('level');
    const exitBtn = document.getElementById('exitBtn') as HTMLButtonElement;

    if (level) {
      setAILevel(Number(level));
      initGame();
      startGameLoop(() => {
        alert('Game Over!');
        window.location.href = '/';
      });
    }

    exitBtn.addEventListener('click', () => {
      window.location.href = '/';
    });

    // // 以下は元のコードの一部を残していますが、必要に応じて削除してください
    // const aiLevelSelect = document.getElementById('aiLevelSelect') as HTMLSelectElement;
    // const startGameBtn = document.getElementById('startGameBtn');
    // const gameContainer = document.getElementById('game-container') as HTMLElement;
    // const gameResult = document.getElementById('gameResult') as HTMLElement;
    // const retryBtn = document.getElementById('retryBtn');

    // // 初期化
    // initGame();

    // // ゲーム開始
    // startGameBtn?.addEventListener('click', () => {
    //   const selectedLevel = aiLevelSelect.value;
    //   setAILevel(Number(selectedLevel));
    //   gameContainer.classList.remove('hidden');
    //   startGameLoop(() => {
    //     // ゲーム終了処理
    //     gameResult.classList.remove('hidden');
    //     gameContainer.classList.add('hidden');
    //   });
    // });

    // リトライ
    // retryBtn?.addEventListener('click', () => {
    //   resetGame();
    //   window.location.reload();
    // });

    // 終了
    exitBtn?.addEventListener('click', () => {
      window.location.href = '/modes';
    });
  },
});

export default SinglePlayPage;
