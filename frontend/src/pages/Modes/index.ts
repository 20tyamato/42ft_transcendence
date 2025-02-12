import { Page } from '@/core/Page';
import LoggedInLayout from '@/layouts/loggedin/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import i18next from 'i18next';

const updateModeContent = () => {
  const singleModeButton = document.querySelector('.single-mode');
  if (singleModeButton) singleModeButton.textContent = i18next.t('singleMode');

  const multiModeButton = document.querySelector('.multi-mode');
  if (multiModeButton) multiModeButton.textContent = i18next.t('multiMode');

  const tournamentModeButton = document.querySelector('.tournament-mode');
  if (tournamentModeButton) tournamentModeButton.textContent = i18next.t('tournamentMode');
};

const ModesPage = new Page({
  name: 'Modes',
  config: {
    layout: LoggedInLayout,
  },
  mounted: async () => {
    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();
      if (userData.language) {
        document.documentElement.lang = userData.language;
        i18next.changeLanguage(userData.language, updateModeContent);
      } else {
        console.error('Language not found in user data');
      }

      const avatarEl = document.getElementById('avatar') as HTMLImageElement;
      if (avatarEl) {
        avatarEl.src = userData.avatar || '/src/layouts/common/avatar.png';
      }

      const singleModeButton = document.querySelector('.single-mode');
      const multiModeButton = document.querySelector('.multi-mode');
      const tournamentModeButton = document.querySelector('.tournament-mode');

      const navigateTo = (path: string) => {
        console.log(`Navigating to ${path}`);
        window.location.href = path;
      };

      singleModeButton?.addEventListener('click', () => navigateTo('/singleplay/select'));
      multiModeButton?.addEventListener('click', () => navigateTo('/multiplay'));
      tournamentModeButton?.addEventListener('click', () => navigateTo('/tournament'));
    } catch (error) {
      console.error(error);
      return;
    }
  },
});

export default ModesPage;
