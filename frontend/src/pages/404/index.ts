import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { updateLanguage } from '@/models/User/repository';
import { initLanguageSwitchers } from '@/utils/languageSwitcher';

export const registerHomeLink = (): void => {
  const homeLink = document.querySelector('a[href="/"]');
  if (!homeLink) return;
  homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    updateLanguage(i18next.language);
    window.location.href = '/';
  });
};

const updatePageContent = (): void => {
  const titleTag = document.querySelector('title');
  if (titleTag) titleTag.textContent = i18next.t('pageNotFound');

  const header = document.querySelector('h1');
  if (header) header.textContent = i18next.t('pageNotFound');

  const backHomeBtn = document.querySelector('.btn');
  if (backHomeBtn) backHomeBtn.textContent = i18next.t('backHome');
};

const NotFoundPage = new Page({
  name: '404',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();

    initLanguageSwitchers(updatePageContent);
    registerHomeLink();

    pg.logger.info('NotFoundPage mounted!');
  },
});

export default NotFoundPage;
