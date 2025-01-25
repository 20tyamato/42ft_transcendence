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

// const SinglePlayPage = new Page({
//   name: 'SinglePlay/Game',
//   config: {
//     layout: CommonLayout,
//   },
//   mounted: async () => {
//     const params = new URLSearchParams(window.location.search);
//     const level = params.get('level');
//     const exitBtn = document.getElementById('exitBtn') as HTMLButtonElement;
//     const retryBtn = document.getElementById('retryBtn');

//     if (level) {
//       setAILevel(Number(level));
//       initGame();
//       startGameLoop(() => {
//         alert('Game Over!');
//         window.location.href = '/';
//       });
//     }

//     // // 以下は元のコードの一部、必要に応じて残す
//     // const aiLevelSelect = document.getElementById('aiLevelSelect') as HTMLSelectElement;
//     // const startGameBtn = document.getElementById('startGameBtn');
//     // const gameContainer = document.getElementById('game-container') as HTMLElement;
//     // const gameResult = document.getElementById('gameResult') as HTMLElement;

//     // // 初期化
//     // initGame();

//     // // ゲーム開始
//     // startGameBtn?.addEventListener('click', () => {
//     //   const selectedLevel = aiLevelSelect.value;
//     //   setAILevel(Number(selectedLevel));
//     //   gameContainer.classList.remove('hidden');
//     //   startGameLoop(() => {
//     //     // ゲーム終了処理
//     //     gameResult.classList.remove('hidden');
//     //     gameContainer.classList.add('hidden');
//     //   });
//     // });

//     // リトライ
//     retryBtn?.addEventListener('click', () => {
//       resetGame();
//       window.location.reload();
//     });

//     // 終了
//     exitBtn?.addEventListener('click', () => {
//       window.location.href = '/modes';
//     });
//   },
// });

// export default SinglePlayPage;
