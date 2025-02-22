import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateOnlineStatus } from '@/models/User/repository';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateInnerHTML, updateText } from '@/utils/updateElements';

const executeLogout = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('トークンが見つからないため、ログアウト API を呼び出さずに処理を続行します。');
    return;
  }
  try {
    const response = await fetch(`${API_URL}/api/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });
    if (!response.ok) {
      console.error('Logout API call failed with status:', response.status);
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};

const clearUserSession = (): void => {
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
    executeLogout();
    clearUserSession();

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
      window.location.href = '/login';
    });

    pg.logger.info('LogoutPage mounted!');
  },
});

export default LogoutPage;
