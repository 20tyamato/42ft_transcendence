// frontend/src/pages/MultiPlay/index.ts
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: { layout: AuthLayout },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    document.getElementById('start-matchmaking')?.addEventListener('click', () => {
      window.location.href = '/multiplay/waiting';
    });
    pg.logger.info('MultiPlay page mounted');
  },
});

export default MultiPlayPage;
