import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const OpeningPage = new Page({
  name: 'Opening',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const quickStartBtn = document.querySelector('a[href="/quickstart"]');
    const singlePlayBtn = document.querySelector('a[href="/singleplay"]');
    const multiPlayBtn = document.querySelector('a[href="/multiplay"]');

    quickStartBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Quick Start clicked!');
      // 画面遷移
      window.location.href = '/quickstart';
    });

    singlePlayBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Single Play clicked!');
      // 画面遷移
      window.location.href = '/singleplay';
    });

    multiPlayBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Multi Play clicked!');
      // 画面遷移
      window.location.href = '/multiplay';
    });
  },
});

export default OpeningPage;
