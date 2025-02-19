import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import i18next from 'i18next';

interface ITournamentHistory {
  date: string;
  result: string;
}

// TODO: ブロックチェーンスコア機能の廃止
// NOTE: バックエンドは削除済
interface IBlockchainScore {
  txHash: string;
  score: number;
}

const languageNames: { [key: string]: string } = {
  en: 'English',
  ja: '日本語',
  fr: 'Français',
};

const updateLabel = (spanId: string, translationKey: string): void => {
  const spanEl = document.getElementById(spanId);
  if (spanEl && spanEl.parentElement) {
    spanEl.parentElement.innerHTML = `${i18next.t(translationKey)}: <span id="${spanId}"></span>`;
  }
};

const updatePageContent = (): void => {
  // Update <title>
  const titleTag = document.querySelector('title');
  if (titleTag) {
    titleTag.textContent = i18next.t('userProfile');
  }

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

  // Update 各ラベル
  updateLabel('username', 'username');
  updateLabel('email', 'emailAddress');
  updateLabel('displayName', 'displayName');
  updateLabel('experience', 'currentExperience');
  updateLabel('level', 'level');
  updateLabel('language', 'language');
  updateLabel('onlineStatus', 'onlineStatus');

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
  const tournamentHeading = document.querySelector('.history-section h2');
  if (tournamentHeading) {
    tournamentHeading.textContent = i18next.t('tournamentHistory');
  }
  const scoresHeading = document.querySelector('.score-section h2');
  if (scoresHeading) {
    scoresHeading.textContent = i18next.t('blockchainScores');
  }

  // Update 編集ボタン
  const editBtn = document.getElementById('edit-btn');
  if (editBtn) {
    editBtn.title = i18next.t('editProfile');
  }
};

const updateFrontElements = (userData: {
  avatar: string;
  username: string;
  email: string;
  display_name: string;
  experience: number;
  level: number;
  language: keyof typeof languageNames;
  is_online: boolean;
}): void => {
  const avatarEl = document.getElementById('avatar') as HTMLImageElement | null;
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const displayNameEl = document.getElementById('displayName');
  const experienceEl = document.getElementById('experience');
  const levelEl = document.getElementById('level');
  const languageEl = document.getElementById('language');
  const onlineStatusEl = document.getElementById('onlineStatus');

  if (avatarEl) {
    avatarEl.src = userData.avatar || '/src/layouts/common/avatar.png';
  }
  if (usernameEl) {
    usernameEl.textContent = userData.username;
  }
  if (emailEl) {
    emailEl.textContent = userData.email;
  }
  if (displayNameEl) {
    displayNameEl.textContent = userData.display_name;
  }
  if (experienceEl) {
    experienceEl.textContent = userData.experience.toString();
  }
  if (levelEl) {
    levelEl.textContent = userData.level.toString();
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
  mounted: async ({ pg }: { pg: Page }) => {
    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();

      // 言語設定とページ文言の更新
      setUserLanguage(userData.language, updatePageContent);

      // フロント側の更新
      const {
        avatar,
        username,
        email,
        display_name,
        experience,
        level,
        language,
        is_online,
      } = userData as {
        avatar: string;
        username: string;
        email: string;
        display_name: string;
        experience: number;
        level: number;
        language: keyof typeof languageNames;
        is_online: boolean;
      };

      updateFrontElements({
        avatar,
        username,
        email,
        display_name,
        experience,
        level,
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
