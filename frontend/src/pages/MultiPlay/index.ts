import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: {
    layout: CommonLayout,
  },
  mounted: () => {
    const startMatchmaking = document.getElementById('start-matchmaking');
    if (startMatchmaking) {
      startMatchmaking.addEventListener('click', () => {
        window.location.href = '/multiplay/waiting';
      });
    }
  },
});

export default MultiPlayPage;
