import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const GameModesPage = new Page({
  name: 'GameModes',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const singleModeButton = document.querySelector('.single-mode');
    const multiModeButton = document.querySelector('.multi-mode');
    const tournamentModeButton = document.querySelector('.tournament-mode');

    const navigateTo = (path: string) => {
      console.log(`Navigating to ${path}`);
      window.location.href = path; // Navigate to the specified path
    };

    singleModeButton?.addEventListener('click', () => navigateTo('/singleplay'));
    multiModeButton?.addEventListener('click', () => navigateTo('/multiplay'));
    tournamentModeButton?.addEventListener('click', () => navigateTo('/tournaments'));
  },
});

export default GameModesPage;
