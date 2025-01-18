import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const modeButtons = document.querySelectorAll('.mode-button');

    modeButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const modes = ['Single Play', 'Tournament'];
        alert(`You selected ${modes[index]} mode!`);
        // Add navigation or other functionality here
      });
    });
  },
});

export default TournamentPage;
