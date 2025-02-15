import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';

const updateLogoutContent = () => {
  const logoutTitle = document.querySelector('.logout-container h1');
  if (logoutTitle) logoutTitle.textContent = i18next.t('logout');

  const logoutMessage = document.getElementById('logout-message');
  if (logoutMessage) logoutMessage.textContent = i18next.t('logoutMessage');

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.textContent = i18next.t('login');
};

const LogoutPage = new Page({
  name: 'Logout',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    updateLogoutContent();
    updateActiveLanguageButton();

    const btnEn = document.getElementById('lang-en');
    const btnJa = document.getElementById('lang-ja');
    const btnFr = document.getElementById('lang-fr');
    btnEn?.addEventListener('click', () => {
      i18next.changeLanguage('en', updateLogoutContent);
      updateActiveLanguageButton();
    });
    btnJa?.addEventListener('click', () => {
      i18next.changeLanguage('ja', updateLogoutContent);
      updateActiveLanguageButton();
    });
    btnFr?.addEventListener('click', () => {
      i18next.changeLanguage('fr', updateLogoutContent);
      updateActiveLanguageButton();
    });

    // TODO: Logout API call
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

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.clear();

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
      window.location.href = '/login';
    });
  },
});

export default LogoutPage;
