import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { updateLanguage } from '@/models/User/repository';
import createThreeScene from '@/pages/Home/scene';

const updateContent = () => {
  const titleTag = document.querySelector('title');
  if (titleTag) titleTag.textContent = i18next.t('pageNotFound');

  const startBtn = document.querySelector('h1');
  if (startBtn) startBtn.textContent = i18next.t('pageNotFound');

  const backHomeBtn = document.querySelector('a[href="/"]');
  if (backHomeBtn) backHomeBtn.textContent = i18next.t('backHome');
};

const NotFoundPage = new Page({
  name: '404',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updateContent();
    updateActiveLanguageButton();

    const btnEn = document.getElementById('lang-en');
    const btnJa = document.getElementById('lang-ja');
    const btnFr = document.getElementById('lang-fr');
    btnEn?.addEventListener('click', () => {
      i18next.changeLanguage('en', updateContent);
      updateActiveLanguageButton();
    });
    btnJa?.addEventListener('click', () => {
      i18next.changeLanguage('ja', updateContent);
      updateActiveLanguageButton();
    });
    btnFr?.addEventListener('click', () => {
      i18next.changeLanguage('fr', updateContent);
      updateActiveLanguageButton();
    });

    pg.logger.info('NotFoundPage mounted!');
    const backHomeBtn = document.querySelector('a[href="/"]');
    backHomeBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      i18next.changeLanguage(i18next.language);
      updateLanguage(i18next.language);
      window.location.href = '/';
    });

    // Three.js 初期化
    createThreeScene();
  },
});

export default NotFoundPage;
