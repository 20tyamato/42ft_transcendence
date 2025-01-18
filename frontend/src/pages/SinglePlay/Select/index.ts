import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlaySelectPage = new Page({
  name: 'Level Selection',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const levelButtons = document.querySelectorAll('.level-button');

    levelButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const levels = ['Easy', 'Medium', 'Hard'];
        alert(`You selected ${levels[index]} level!`);
        // Add navigation or other functionality here
      });
    });
  },
});

export default SinglePlaySelectPage;
