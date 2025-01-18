import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const ModesPage = new Page({
  name: 'GameModes',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const singleModeButton = document.querySelector('.single-mode');
    const multiModeButton = document.querySelector('.multi-mode');
    const tournamentModeButton = document.querySelector('.tournament-mode');

    const handleClick = (mode: string) => {
      console.log(`${mode} button clicked`);
      alert(`You selected ${mode}!`);
      // Add navigation or mode-specific logic here
    };

    singleModeButton?.addEventListener('click', () => handleClick('Single Mode'));
    multiModeButton?.addEventListener('click', () => handleClick('Multi Mode'));
    tournamentModeButton?.addEventListener('click', () => handleClick('Tournament Mode'));
  },
});

export default ModesPage;
