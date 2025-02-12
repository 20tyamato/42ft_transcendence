import { Page } from '@/core/Page';
import LoggedInLayout from '@/layouts/loggedin/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';

const ModesPage = new Page({
  name: 'Modes',
  config: {
    layout: LoggedInLayout,
  },
  mounted: async () => {
    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();

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
