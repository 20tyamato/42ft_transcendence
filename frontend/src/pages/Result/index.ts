import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const ResultPage = new Page({
  name: 'Result',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    console.log('Result page is mounted');
  },
});

export default ResultPage;
