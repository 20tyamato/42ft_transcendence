import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { getUserMatchHistory, getUserWithStats } from '@/models/User/repository';
import { IUser } from '@/models/User/type';
import { formatDate } from '@/utils/date';
import { languageNames, setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('userProfile'));
  // 基本情報ラベル
  updateText('#username-label', i18next.t('username'));
  updateText('#email-label', i18next.t('emailAddress'));
  updateText('#level-label', i18next.t('level'));
  updateText('#language-label', i18next.t('language'));

  // 統計情報ラベル
  updateText('.stats-section h2', i18next.t('gameStatistics'));
  updateText('.stats-grid .stat-item:nth-of-type(1) .stat-label', i18next.t('totalMatches'));
  updateText('.stats-grid .stat-item:nth-of-type(2) .stat-label', i18next.t('wins'));
  updateText('.stats-grid .stat-item:nth-of-type(3) .stat-label', i18next.t('losses'));
  updateText('.stats-grid .stat-item:nth-of-type(4) .stat-label', i18next.t('tournamentWins'));

  // マッチ履歴
  updateText('.match-history-section h2', i18next.t('recentMatches'));
  updateText('#noMatchesMessage', i18next.t('noMatchesAvailable'));

  // タップヒントとボタン
  const tapHints = document.querySelectorAll('.tap-hint');
  if (tapHints.length > 0) {
    if (tapHints[0]) {
      tapHints[0].textContent = i18next.t('tapToShowBack');
    }
    if (tapHints[1]) {
      tapHints[1].textContent = i18next.t('tapToShowFront');
    }
  }

  // 編集ボタン
  const editBtn = document.getElementById('edit-btn');
  if (editBtn) {
    editBtn.title = i18next.t('editProfile');
  }
};

const updateFrontElements = (userData: IUser): void => {
  // 基本情報
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const displayNameTitleEl = document.getElementById('displayNameTitle');
  const avatarEl = document.getElementById('avatar') as HTMLImageElement | null;
  const levelEl = document.getElementById('level');
  const languageEl = document.getElementById('language');

  // 基本情報の更新
  if (usernameEl) {
    usernameEl.textContent = userData.username;
  }
  if (emailEl) {
    emailEl.textContent = userData.email;
  }
  if (displayNameTitleEl) {
    displayNameTitleEl.textContent = userData.display_name;
  }
  if (avatarEl) {
    avatarEl.src = userData.avatar || '/src/resources/avatar.png';
  }
  if (levelEl) {
    levelEl.textContent = userData.level.toString();
  }
  if (languageEl) {
    languageEl.textContent = languageNames[userData.language];
  }

  // 統計情報の更新
  const totalMatchesEl = document.getElementById('totalMatches');
  const winsEl = document.getElementById('wins');
  const lossesEl = document.getElementById('losses');
  const tournamentWinsEl = document.getElementById('tournamentWins');

  if (totalMatchesEl) {
    totalMatchesEl.textContent = userData.total_matches?.toString() || '0';
  }
  if (winsEl) {
    winsEl.textContent = userData.wins?.toString() || '0';
  }
  if (lossesEl) {
    lossesEl.textContent = userData.losses?.toString() || '0';
  }
  if (tournamentWinsEl) {
    tournamentWinsEl.textContent = userData.tournament_wins?.toString() || '0';
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

// マッチ履歴の表示を担当する新しい関数
const updateMatchHistory = async (userId: string): Promise<void> => {
  const matchHistoryList = document.getElementById('matchHistoryList');
  const loadingSpinner = document.getElementById('matchHistoryLoading');
  const noMatchesMessage = document.getElementById('noMatchesMessage');

  if (!matchHistoryList) return;

  try {
    // 以前のマッチ履歴をクリア
    const existingMatches = matchHistoryList.querySelectorAll('.match-item');
    existingMatches.forEach((item) => item.remove());

    // ローディング表示
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (noMatchesMessage) noMatchesMessage.classList.add('hidden');

    // マッチ履歴取得
    const matches = await getUserMatchHistory('me');

    matches.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // ローディング非表示
    if (loadingSpinner) loadingSpinner.style.display = 'none';

    // データなしの場合
    if (!matches || matches.length === 0) {
      if (noMatchesMessage) noMatchesMessage.classList.remove('hidden');
      return;
    }

    // マッチ履歴アイテムの生成
    matches.forEach((match) => {
      const matchItem = document.createElement('div');
      matchItem.className = `match-item ${match.result}`;

      matchItem.innerHTML = `
        <div class="match-date">${formatDate(match.date)}</div>
        <div class="match-details">
          <div class="match-opponent">vs. ${match.opponent}</div>
          <div class="match-type">${match.match_type}</div>
        </div>
        <div class="match-result">
          <div class="match-score">${match.score_player1} - ${match.score_player2}</div>
          <div class="result-badge ${match.result}">${match.result.toUpperCase()}</div>
        </div>
      `;

      matchHistoryList.appendChild(matchItem);
    });
  } catch (error) {
    console.error('Error updating match history:', error);
    // エラー処理
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (noMatchesMessage) {
      noMatchesMessage.textContent = 'Failed to load match history.';
      noMatchesMessage.classList.remove('hidden');
    }
  }
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
    layout: AuthLayout,
  },
  mounted: async ({ pg, user }): Promise<void> => {
    try {
      // 言語設定とページ文言の更新
      setUserLanguage(user.language, updatePageContent);

      // 統計情報を含むユーザーデータを取得
      const userWithStats = await getUserWithStats('me');

      if (userWithStats) {
        // 前面の更新（統計情報含む）
        updateFrontElements(userWithStats);
        updateCardColor(userWithStats.level);
      } else {
        // フォールバック：基本情報のみで表示
        updateFrontElements(user);
        updateCardColor(user.level);
      }

      // マッチ履歴の取得と表示
      await updateMatchHistory('me');

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
