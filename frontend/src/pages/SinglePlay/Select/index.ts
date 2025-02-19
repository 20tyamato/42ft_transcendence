import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import i18next from 'i18next';

const updatePageContent = () => {
  const easyLevelCard = document.querySelector('.easy-level h1');
  if (easyLevelCard) easyLevelCard.textContent = i18next.t('easyLevel');

  const mediumLevelCard = document.querySelector('.medium-level h1');
  if (mediumLevelCard) mediumLevelCard.textContent = i18next.t('mediumLevel');

  const hardLevelCard = document.querySelector('.hard-level h1');
  if (hardLevelCard) hardLevelCard.textContent = i18next.t('hardLevel');

  const secretLevelCard = document.querySelector('.secret-level h1');
  if (secretLevelCard) secretLevelCard.textContent = i18next.t('secretLevel');
};

const SinglePlaySelectPage = new Page({
  name: 'SinglePlay/Select',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    checkUserAccess();

    const userData = await fetchCurrentUser();
    if (userData.language) {
      document.documentElement.lang = userData.language;
      i18next.changeLanguage(userData.language, updatePageContent);
    }

    if (userData.level < 5) {
      const secretLevelCard = document.querySelector('.level-card.secret-level');
      if (secretLevelCard instanceof HTMLElement) {
        secretLevelCard.style.display = 'none';
      }
    }

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
          localStorage.setItem('selectedLevel', level);
          console.log(`Selected level: ${level}`);
          showLoadingScreen('/singleplay/game');
        } else {
          console.error('Level attribute not found on button.');
        }
      });
    });
  },
});

export default SinglePlaySelectPage;
