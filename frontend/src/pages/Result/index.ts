import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const ResultPage = new Page({
  name: 'Result',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const backBtn = document.getElementById('backBtn');

    backBtn?.addEventListener('click', () => {
      window.location.href = '/';
    });
  },
});

export default ResultPage;
