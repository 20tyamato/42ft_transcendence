import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { isLoggedIn } from '@/models/User/auth';
import { updateLanguage } from '@/models/User/repository';
import createThreeScene from '@/pages/Home/scene';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const registerStartButton = (): void => {
  const startBtn = document.querySelector('a[href="/login"]');
  startBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    if (isLoggedIn()) {
      i18next.changeLanguage(i18next.language);
      updateLanguage(i18next.language);
      window.location.href = '/modes';
    } else {
      window.location.href = '/login';
    }
  });
};

const updatePageContent = () => {
  updateText('title', i18next.t('home'));
  updateText('.btn', i18next.t('start'));
};

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();

    registerLanguageSwitchers(updatePageContent);
    registerStartButton();

    createThreeScene();

    pg.logger.info('HomePage mounted!');
  },
});

export default HomePage;
