import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { executeLogout } from '@/models/User/auth';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateInnerHTML, updateText } from '@/utils/updateElements';

const registerLoginButton = (): void => {
  const logoutBtn = document.getElementById('login-btn');
  logoutBtn?.addEventListener('click', () => {
    window.location.href = '/login';
  });
};

const updatePageContent = (): void => {
  updateText('title', i18next.t('logout'));
  updateText('.logout-container h1', i18next.t('logout'));
  updateText('label[for="username"]', i18next.t('username'));
  updateInnerHTML('#logout-message', i18next.t('logoutMessage'));
  updateText('#login-btn', i18next.t('login'));
};

const LogoutPage = new Page({
  name: 'Logout',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    updatePageContent();
    updateActiveLanguageButton();
    registerLanguageSwitchers(updatePageContent);

    registerLoginButton();

    executeLogout();

    pg.logger.info('LogoutPage mounted!');
  },
});

export default LogoutPage;
