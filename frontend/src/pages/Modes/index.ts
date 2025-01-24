import { Page } from '@/core/Page';
import LoggedInLayout from '@/layouts/loggedin/index';

const ModesPage = new Page({
  name: 'Modes',
  config: {
    layout: LoggedInLayout,
  },
  mounted: async () => {
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
  },
});

export default ModesPage;
