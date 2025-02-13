import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    checkUserAccess();
    const backBtn = document.getElementById('backBtn');

    backBtn?.addEventListener('click', () => {
      window.location.href = '/';
    });
  },
});

export default TournamentPage;
