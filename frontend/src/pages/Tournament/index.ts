import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const TournamentPage = new Page({
  name: 'Tournament',
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

export default TournamentPage;
