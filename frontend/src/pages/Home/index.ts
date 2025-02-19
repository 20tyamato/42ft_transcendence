import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { isLoggedIn } from '@/models/User/auth';
import { updateLanguage } from '@/models/User/repository';
import createThreeScene from '@/pages/Home/scene';

const updateContent = () => {
  const startBtn = document.querySelector('.btn');
  if (startBtn) startBtn.textContent = i18next.t('start');
};

const HomePage = new Page({
  name: 'Home',
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

    pg.logger.info('HomePage mounted!');
    const loginBtn = document.querySelector('a[href="/login"]');
    loginBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isLoggedIn()) {
        i18next.changeLanguage(i18next.language);
        updateLanguage(i18next.language);
        window.location.href = '/modes';
      } else {
        window.location.href = '/login';
      }
    });

    // Three.js 初期化
    createThreeScene();
  },
});

export default HomePage;
