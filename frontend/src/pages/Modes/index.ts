import { API_URL } from '@/config/config';
import { Page } from '@/core/Page';
import LoggedInLayout from '@/layouts/loggedin/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser, updateOnlineStatus } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import i18next from 'i18next';

const clearUserSession = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.clear();
};

// idleTimer をモジュールスコープで保持
let idleTimer: number | null = null;

const resetTimer = () => {
  const idleTimeout = 10000; // 10秒

  // 既にタイマーが設定されている場合はクリアする
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  // 新たなタイマーをセットする
  idleTimer = window.setTimeout(() => {
    try {
      updateOnlineStatus(false);
      fetch(`${API_URL}/api/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      clearUserSession();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }, idleTimeout);
};

const updatePageContent = (): void => {
  const modeTextMap: { selector: string; translationKey: string }[] = [
    { selector: '.single-mode', translationKey: 'singleMode' },
    { selector: '.multi-mode', translationKey: 'multiMode' },
    { selector: '.tournament-mode', translationKey: 'tournamentMode' },
  ];

  modeTextMap.forEach(({ selector, translationKey }) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = i18next.t(translationKey);
    }
  });
};

const initNavigationButtons = (): void => {
  const navigateTo = (path: string): void => {
    console.log(`Navigating to ${path}`);
    window.location.href = path;
  };

  const navConfig: { selector: string; path: string }[] = [
    { selector: '.single-mode', path: '/singleplay/select' },
    { selector: '.multi-mode', path: '/multiplay' },
    { selector: '.tournament-mode', path: '/tournament' },
  ];

  navConfig.forEach(({ selector, path }) => {
    const button = document.querySelector(selector);
    if (button) {
      button.addEventListener('click', () => navigateTo(path));
    }
  });
};

const updateUserAvatar = (avatar?: string): void => {
  const avatarEl = document.getElementById('avatar') as HTMLImageElement | null;
  if (avatarEl) {
    avatarEl.src = avatar || '/src/layouts/common/avatar.png';
  }
};

const ModesPage = new Page({
  name: 'Modes',
  config: {
    layout: LoggedInLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    try {
      resetTimer();
      checkUserAccess();
      const userData = await fetchCurrentUser();

      setUserLanguage(userData.language, updatePageContent);
      updateUserAvatar(userData.avatar);

      initNavigationButtons();

      pg.logger.info('ModesPage mounted!');

      ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
        window.addEventListener(event, resetTimer);
      });
    } catch (error) {
      console.error(error);
    }
  },
});

export default ModesPage;
