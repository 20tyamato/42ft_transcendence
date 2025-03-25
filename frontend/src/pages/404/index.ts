import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateLanguage } from '@/models/User/repository';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const registerHomeLink = (): void => {
  const homeLink = document.querySelector('a[href="/"]');
  if (!homeLink) return;
  homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    updateLanguage(i18next.language);
    window.location.href = '/';
  });
};

const updatePageContent = (): void => {
  updateText('title', i18next.t('pageNotFound'));
  updateText('h1', i18next.t('pageNotFound'));
  updateText('.btn', i18next.t('backHome'));
};

const NotFoundPage = new Page({
  name: '404',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }): Promise<void> => {
    updatePageContent();
    updateActiveLanguageButton();

    registerLanguageSwitchers(updatePageContent);
    registerHomeLink();

    pg.logger.info('NotFoundPage mounted!');
  },
});

export default NotFoundPage;
