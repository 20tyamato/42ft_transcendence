import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { isLoggedIn } from '@/models/User/auth';
import { updateLanguage } from '@/models/User/repository';
import createThreeScene from '@/pages/Home/scene';
import { initLanguageSwitchers } from '@/utils/languageSwitcher';

const updatePageContent = () => {
  const startBtn = document.querySelector('.btn');
  if (startBtn) startBtn.textContent = i18next.t('start');
};

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();

    initLanguageSwitchers(updatePageContent);

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

    createThreeScene();
  },
});

export default HomePage;
