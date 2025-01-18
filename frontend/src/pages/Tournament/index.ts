import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    console.log('Tournament page is mounted');
  },
});

export default TournamentPage;
