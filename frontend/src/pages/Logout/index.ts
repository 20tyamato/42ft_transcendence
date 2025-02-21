import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateOnlineStatus } from '@/models/User/repository';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateInnerHTML, updateText } from '@/utils/updateElements';

const executeLogout = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/api/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};

const clearUserSession = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.clear();
};

const registerLogoutButton = (): void => {
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    window.location.href = '/login';
  });
};

const updatePageContent = (): void => {
  updateText('title', i18next.t('logout'));
  updateText('.logout-container h1', i18next.t('logout'));
  updateText('label[for="username"]', i18next.t('username'));
  updateInnerHTML('#logout-message', i18next.t('logoutMessage'));
  updateText('#logout-btn', i18next.t('login'));
};

const LogoutPage = new Page({
  name: 'Logout',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();
    registerLanguageSwitchers(updatePageContent);

    updateOnlineStatus(false);
    await executeLogout();
    clearUserSession();

    registerLogoutButton();

    pg.logger.info('LogoutPage mounted!');
  },
});

export default LogoutPage;
