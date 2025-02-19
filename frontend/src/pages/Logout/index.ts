import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { updateOnlineStatus } from '@/models/User/repository';
import { initLanguageSwitchers } from '@/utils/language';

const updatePageContent = (): void => {
  const logoutTitle = document.querySelector('.logout-container h1');
  if (logoutTitle) logoutTitle.textContent = i18next.t('logout');

  const logoutMessage = document.getElementById('logout-message');
  if (logoutMessage) logoutMessage.textContent = i18next.t('logoutMessage');

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.textContent = i18next.t('login');
};

const performLogout = async (): Promise<void> => {
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

const registerLogoutButtonHandler = (): void => {
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    window.location.href = '/login';
  });
};

const LogoutPage = new Page({
  name: 'Logout',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();
    initLanguageSwitchers(updatePageContent);

    updateOnlineStatus(false);
    await performLogout();

    clearUserSession();
    
    registerLogoutButtonHandler();

    pg.logger.info('LogoutPage mounted!');
  },
});

export default LogoutPage;
