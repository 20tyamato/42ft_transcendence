import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlaySelectPage = new Page({
  name: 'SinglePlay/Select',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const levelButtons = document.querySelectorAll('.level-button');
    const levels = ['Easy', 'Medium', 'Hard'];

    const loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement | null;
    const countdownDisplay = document.getElementById('countdown') as HTMLSpanElement | null;

    function showLoadingScreen(targetPath: string) {
      if (!loadingOverlay || !countdownDisplay) return;
      loadingOverlay.classList.remove('hidden');

      let remaining = 3;

      countdownDisplay.textContent = remaining.toString();

      const intervalId = setInterval(() => {
        remaining -= 1;
        countdownDisplay.textContent = remaining.toString();

        if (remaining <= 0) {
          clearInterval(intervalId);
          window.location.href = targetPath;
        }
      }, 1000);
    }

    levelButtons.forEach((button, index) => {
      button.addEventListener('click', async () => {
        console.log('Navigating to /singleplay/game');
        showLoadingScreen('/singleplay/game');
        const selectedLevel = levels[index];
        console.log(`You selected ${selectedLevel} level!`);

        // try {
        //   const response = await fetch('http://127.0.0.1:8000/api/games/', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //       level: selectedLevel,
        //     }),
        //   });

        //   if (!response.ok) {
        //     throw new Error('Failed to create game');
        //   }

        //   const data = await response.json();
        //   // data は { game_id: <作成された Game のID> } の想定

        //   // window.location.href = `/game/${data.game_id}/?level=${selectedLevel}`;
        //   window.location.href = `/singleplay/game/`;

        // } catch (error) {
        //   console.error(error);
        // }
      });
    });
  },
});

// import { initGame, startGameLoop, setAILevel } from '../Game/logic';

// document.addEventListener('DOMContentLoaded', () => {
//   const levelButtons = document.querySelectorAll('.level-button');
//   const loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement | null;
//   const countdownDisplay = document.getElementById('countdown') as HTMLSpanElement | null;
//   const gameContainer = document.getElementById('game-container') as HTMLElement;

//   levelButtons.forEach((button) => {
//     button.addEventListener('click', () => {
//       const selectedLevel = parseInt(button.getAttribute('data-level') || '1');
//       setAILevel(selectedLevel);

//       // Show loading overlay
//       if (loadingOverlay && countdownDisplay) {
//         loadingOverlay.classList.remove('hidden');
//         let countdown = 3;
//         countdownDisplay.textContent = countdown.toString();

//         const countdownInterval = setInterval(() => {
//           countdown -= 1;
//           countdownDisplay.textContent = countdown.toString();

//           if (countdown <= 0) {
//             clearInterval(countdownInterval);
//             loadingOverlay.classList.add('hidden');
//             gameContainer.classList.remove('hidden');
//             initGame();
//             startGameLoop(() => alert('Game Over!'));
//           }
//         }, 1000);
//       }
//     });
//   });
// });

export default SinglePlaySelectPage;
