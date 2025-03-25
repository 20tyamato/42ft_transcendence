// frontend/src/pages/MultiPlay/index.ts
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('multiplay.pageTitle'));
  updateText('h1', i18next.t('multiplay.heading'));
  updateText('#start-matchmaking', i18next.t('multiplay.startMatchmaking'));
};

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }): Promise<void> => {
    setUserLanguage(user.language, updatePageContent);
    document.getElementById('start-matchmaking')?.addEventListener('click', () => {
      window.location.href = '/multiplay/waiting';
    });
    pg.logger.info('MultiPlay page mounted');
  },
});

export default MultiPlayPage;
