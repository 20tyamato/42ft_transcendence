import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const button = document.getElementById('click-button');
    const count = document.getElementById('click-count');

    let clickCount = 0;
    button?.addEventListener('click', () => {
      clickCount++;
      count!.textContent = clickCount.toString();
    });
  },
});

export default HomePage;
