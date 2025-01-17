import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const loginBtn = document.querySelector('a[href="/login"]');

    loginBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '/login';
    });
  },
});

export default HomePage;
