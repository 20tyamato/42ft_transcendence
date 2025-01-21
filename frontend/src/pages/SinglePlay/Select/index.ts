import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlaySelectPage = new Page({
  name: 'SinglePlay/Select',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const levelButtons = document.querySelectorAll('.level-button');

    function showLoadingScreen(targetPath: string) {
      const loadingOverlay = document.getElementById('loading-overlay');
      const countdownDisplay = document.getElementById('countdown');
      let remaining = 3;

      if (loadingOverlay && countdownDisplay) {
        loadingOverlay.classList.remove('hidden');
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
    }

    levelButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const level = button.getAttribute('data-level');
        if (level) {
          localStorage.setItem('selectedLevel', level); // レベルを保存
          console.log(`Selected level: ${level}`);
          showLoadingScreen('/singleplay/game'); // 正しいURLに遷移
        } else {
          console.error('Level attribute not found on button.');
        }
      });
    });
  },
});
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
//       });
//     });
//   },
// });

export default SinglePlaySelectPage;
