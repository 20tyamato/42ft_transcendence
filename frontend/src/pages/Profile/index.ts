import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { IBlockchainScore, ITournamentHistory } from '@/models/interface';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import { IUser } from '@/models/User/type';
import { languageNames, setUserLanguage } from '@/utils/language';
import { updateInnerHTML, updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('userProfile'));

  // Update myCard テキスト
  const myCardEl = document.getElementById('mycard');
  if (myCardEl) {
    for (const node of myCardEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = i18next.t('myCard') + ' ';
        break;
      }
    }
  }

  updateInnerHTML('username', i18next.t('username'));
  updateInnerHTML('email', i18next.t('emailAddress'));
  updateInnerHTML('displayName', i18next.t('displayName'));
  updateInnerHTML('experience', i18next.t('currentExperience'));
  updateInnerHTML('level', i18next.t('level'));
  updateInnerHTML('language', i18next.t('language'));
  updateInnerHTML('onlineStatus', i18next.t('onlineStatus'));

  // Update tap hints
  const tapHints = document.querySelectorAll('.tap-hint');
  if (tapHints.length > 0) {
    if (tapHints[0]) {
      tapHints[0].textContent = i18next.t('tapToShowBack');
    }
    if (tapHints[1]) {
      tapHints[1].textContent = i18next.t('tapToShowFront');
    }
  }

  // Update セクション見出し
  updateText('.history-section h2', i18next.t('tournamentHistory'));
  updateText('.score-section h2', i18next.t('blockchainScores'));

  // Update 編集ボタン
  const editBtn = document.getElementById('edit-btn');
  if (editBtn) {
    editBtn.title = i18next.t('editProfile');
  }
};

const updateFrontElements = (userData: IUser): void => {
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const displayNameEl = document.getElementById('displayName');
  const avatarEl = document.getElementById('avatar') as HTMLImageElement | null;
  const levelEl = document.getElementById('level');
  const experienceEl = document.getElementById('experience');
  const languageEl = document.getElementById('language');
  const onlineStatusEl = document.getElementById('onlineStatus');

  if (usernameEl) {
    usernameEl.textContent = userData.username;
  }
  if (emailEl) {
    emailEl.textContent = userData.email;
  }
  if (displayNameEl) {
    displayNameEl.textContent = userData.display_name;
  }
  if (avatarEl) {
    avatarEl.src = userData.avatar || '/src/resources/avatar.png';
  }
  if (levelEl) {
    levelEl.textContent = userData.level.toString();
  }
  if (experienceEl) {
    experienceEl.textContent = userData.experience.toString();
  }
  if (languageEl) {
    languageEl.textContent = languageNames[userData.language];
  }
  if (onlineStatusEl) {
    onlineStatusEl.textContent = userData.is_online ? 'Online' : 'Offline';
  }
};

const updateCardColor = (level: number): void => {
  const cardClasses = ['level-1-5', 'level-6-10', 'level-11-15', 'level-16-20', 'level-21-25'];
  const cardBack = document.querySelector('.card-back') as HTMLElement | null;
  const cardFront = document.querySelector('.card-front') as HTMLElement | null;

  const getLevelClass = (level: number): string => {
    if (level <= 5) return 'level-1-5';
    if (level <= 10) return 'level-6-10';
    if (level <= 15) return 'level-11-15';
    if (level <= 20) return 'level-16-20';
    return 'level-21-25';
  };

  const newClass = getLevelClass(level);

  [cardBack, cardFront].forEach((card) => {
    if (card) {
      card.classList.remove(...cardClasses);
      card.classList.add(newClass);
    }
  });
};

const updateBackElements = (
  tournamentHistory: ITournamentHistory[],
  blockchainScores: IBlockchainScore[]
): void => {
  const tournamentHistoryEl = document.getElementById('tournamentHistory');
  const scoreListEl = document.getElementById('scoreList');

  // トーナメント履歴更新
  tournamentHistory.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.date} - ${item.result}`;
    tournamentHistoryEl?.appendChild(li);
  });

  // ブロックチェーンスコア更新
  blockchainScores.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `TxHash: ${item.txHash} | Score: ${item.score}`;
    scoreListEl?.appendChild(li);
  });
};

const attachActionButtonHandlers = (): void => {
  const editBtn = document.getElementById('edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // カードの反転を防止
      window.location.href = '/settings/user';
    });
  }

  const friendBtn = document.getElementById('friend-btn');
  if (friendBtn) {
    friendBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // カードの反転を防止
      window.location.href = '/friends';
    });
  }
};

const attachCardFlipHandler = (): void => {
  const profileCard = document.querySelector('.profile-card');
  if (profileCard) {
    profileCard.addEventListener('click', () => {
      const cardInner = profileCard.querySelector('.card-inner');
      cardInner?.classList.toggle('is-flipped');
    });
  }
};

const attachCloseButtonHandlers = (): void => {
  const frontCloseBtn = document.querySelector('.card-front .close-btn');
  if (frontCloseBtn) {
    frontCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // カード反転を防止
      window.location.href = '/modes';
    });
  }

  const backCloseBtn = document.querySelector('.card-back .close-btn');
  if (backCloseBtn) {
    backCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // カード反転を防止
      window.location.href = '/modes';
    });
  }
};

const ProfilePage = new Page({
  name: 'Profile',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    try {
      checkUserAccess();
      const userData: IUser = await fetchCurrentUser();

      // 言語設定とページ文言の更新
      setUserLanguage(userData.language.toString(), updatePageContent);

      // フロント側の更新
      const { username, email, display_name, avatar, level, experience, language, is_online } =
        userData;

      updateFrontElements({
        username,
        email,
        display_name,
        avatar,
        level,
        experience,
        language,
        is_online,
      });
      updateCardColor(level);

      // サンプルデータ（本来は API 等から取得）
      const tournamentHistory: ITournamentHistory[] = [
        { date: '2025-01-01', result: 'Won' },
        { date: '2025-01-05', result: 'Lost' },
      ];
      const blockchainScores: IBlockchainScore[] = [
        { txHash: '0x123...', score: 100 },
        { txHash: '0x456...', score: 80 },
      ];
      updateBackElements(tournamentHistory, blockchainScores);

      // 各種ボタンのイベント登録
      attachActionButtonHandlers();
      attachCardFlipHandler();
      attachCloseButtonHandlers();

      pg.logger.info('ProfilePage mounted!');
    } catch (error) {
      console.error('Error in mounted():', error);
    }
  },
});

export default ProfilePage;
