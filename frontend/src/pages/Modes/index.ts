import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import LoggedInLayout from '@/layouts/loggedin/index';
import { checkUserAccess, executeLogout } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import { initResetTimerListeners, resetTimer } from '@/models/Window/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const DEFAULT_AVATAR_SRC = '/src/resources/avatar.png';
let isInternalNavigation = false;

const updatePageContent = (): void => {
  updateText('title', i18next.t('modes'));
  updateText('.single-mode', i18next.t('singleMode'));
  updateText('.multi-mode', i18next.t('multiMode'));
  updateText('.tournament-mode', i18next.t('tournamentMode'));
};

const navigateTo = (path: string): void => {
  isInternalNavigation = true;
  console.log(`Navigating to ${path}`);
  window.location.href = path;
};

const bindNavigationButton = (selector: string, path: string): void => {
  const button = document.querySelector(selector);
  if (button) {
    button.addEventListener('click', () => navigateTo(path));
  }
};

const registerNavigationButtons = (): void => {
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

const setupBeforeUnloadLogout = (): void => {
  window.addEventListener('beforeunload', () => {
    if (isInternalNavigation) return;
    executeLogout();
  });
};

const mountModesPage = async (pg: Page): Promise<void> => {
  try {
    resetTimer();
    checkUserAccess();

    const userData = await fetchCurrentUser();
    setUserLanguage(userData.language, updatePageContent);
    updateUserAvatar(userData.avatar);
    registerNavigationButtons();

    initResetTimerListeners();
    setupBeforeUnloadLogout();

    pg.logger.info('ModesPage mounted!');
  } catch (error) {
    console.error(error);
  }
};

const ModesPage = new Page({
  name: 'Modes',
  config: { layout: LoggedInLayout },
  mounted: async ({ pg }: { pg: Page }) => mountModesPage(pg),
});

export default ModesPage;
