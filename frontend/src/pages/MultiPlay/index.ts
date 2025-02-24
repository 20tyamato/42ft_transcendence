import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: { layout: CommonLayout },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    document.getElementById('start-matchmaking')?.addEventListener('click', () => {
      window.location.href = '/multiplay/waiting';
    });
    pg.logger.info('MultiPlay page mounted');
  },
});

export default MultiPlayPage;
