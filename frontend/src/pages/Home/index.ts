import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const quickStartBtn = document.querySelector('a[href="/quickstart"]');
    const singlePlayBtn = document.querySelector('a[href="/singleplay"]');
    const multiPlayBtn = document.querySelector('a[href="/multiplay"]');
    const registerBtn = document.querySelector('a[href="/register"]');

    quickStartBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Quick Start clicked!');
      window.location.href = '/quickstart';
    });

    singlePlayBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Single Play clicked!');
      window.location.href = '/singleplay';
    });

    multiPlayBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Multi Play clicked!');
      window.location.href = '/multiplay';
    });

    registerBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Register clicked!');
      window.location.href = '/register';
    });
  },
});

export default HomePage;
