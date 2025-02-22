import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import LoggedInLayout from '@/layouts/loggedin/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import { initResetTimerListeners, resetTimer } from '@/models/Window/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const DEFAULT_AVATAR_SRC = '/src/resources/avatar.png';

const updatePageContent = (): void => {
  updateText('title', i18next.t('modes'));
  updateText('.single-mode', i18next.t('singleMode'));
  updateText('.multi-mode', i18next.t('multiMode'));
  updateText('.tournament-mode', i18next.t('tournamentMode'));
};

const registerNavigationButtons = (): void => {
  const navigateTo = (path: string): void => {
    console.log(`Navigating to ${path}`);
    window.location.href = path;
  };

  const bindNavigationButton = (selector: string, path: string): void => {
    const button = document.querySelector(selector);
    if (button) {
      button.addEventListener('click', () => navigateTo(path));
    }
  };

  bindNavigationButton('.single-mode', '/singleplay/select');
  bindNavigationButton('.multi-mode', '/multiplay');
  bindNavigationButton('.tournament-mode', '/tournament');
};

const updateUserAvatar = (avatar?: string): void => {
  const avatarEl = document.getElementById('avatar') as HTMLImageElement | null;
  if (avatarEl) {
    avatarEl.src = avatar || DEFAULT_AVATAR_SRC;
  }
};

const clearUserSession = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.clear();
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
      registerNavigationButtons();

      initResetTimerListeners();

      // ウィンドウを閉じると、ログアウト処理を行う
      window.addEventListener('beforeunload', () => {
        const url = `${API_URL}/api/logout/`;
        const data = JSON.stringify({}); // 必要に応じてログアウトに必要な情報を付加
      
        // navigator.sendBeacon が利用可能であれば使用する
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, data);
        } else {
          // sendBeacon 非対応の場合、fetch の keepalive オプションを利用（ただし完全な信頼性は保証されません）
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            credentials: 'include',
            keepalive: true,
          });
        }
      
        // クライアント側のセッション情報をクリアする
        clearUserSession();
      });

      pg.logger.info('ModesPage mounted!');
    } catch (error) {
      console.error(error);
    }
  },
});

export default ModesPage;
