import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { isLoggedIn } from '@/models/User/auth';
import createThreeScene from '@/pages/Home/scene';

const updateHomeContent = () => {
  const startBtn = document.querySelector('.btn');
  if (startBtn) startBtn.textContent = i18next.t('start');
};

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updateHomeContent();
    updateActiveLanguageButton();

    const btnEn = document.getElementById('lang-en');
    const btnJa = document.getElementById('lang-ja');
    const btnFr = document.getElementById('lang-fr');
    btnEn?.addEventListener('click', () => {
      i18next.changeLanguage('en', updateHomeContent);
      updateActiveLanguageButton();
    });
    btnJa?.addEventListener('click', () => {
      i18next.changeLanguage('ja', updateHomeContent);
      updateActiveLanguageButton();
    });
    btnFr?.addEventListener('click', () => {
      i18next.changeLanguage('fr', updateHomeContent);
      updateActiveLanguageButton();
    });

    pg.logger.info('HomePage mounted!');
    const loginBtn = document.querySelector('a[href="/login"]');
    loginBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isLoggedIn()) {
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
