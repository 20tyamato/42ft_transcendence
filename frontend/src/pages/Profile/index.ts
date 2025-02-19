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

const languageNames = {
  en: 'English',
  ja: '日本語',
  fr: 'Français',
};

const updatePageContent = () => {
  const titleTag = document.querySelector('title');
  if (titleTag) {
    titleTag.textContent = i18next.t('userProfile');
  }

  const myCardEl = document.getElementById('mycard');
  if (myCardEl) {
    for (const node of myCardEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = i18next.t('myCard') + ' ';
        break;
      }
    }
  }

  const updateLabel = (spanId: string, translationKey: string) => {
    const spanEl = document.getElementById(spanId);
    if (spanEl && spanEl.parentElement) {
      spanEl.parentElement.innerHTML = `${i18next.t(translationKey)}: <span id="${spanId}"></span>`;
    }
  };

  updateLabel('username', 'username');
  updateLabel('email', 'emailAddress');
  updateLabel('displayName', 'displayName');
  updateLabel('experience', 'currentExperience');
  updateLabel('level', 'level');
  updateLabel('language', 'language');
  updateLabel('onlineStatus', 'onlineStatus');

  const tapHints = document.querySelectorAll('.tap-hint');
  if (tapHints.length > 0) {
    if (tapHints[0]) {
      tapHints[0].textContent = i18next.t('tapToShowBack');
    }
    if (tapHints[1]) {
      tapHints[1].textContent = i18next.t('tapToShowFront');
    }
  }

  const tournamentHeading = document.querySelector('.history-section h2');
  if (tournamentHeading) {
    tournamentHeading.textContent = i18next.t('tournamentHistory');
  }
  const scoresHeading = document.querySelector('.score-section h2');
  if (scoresHeading) {
    scoresHeading.textContent = i18next.t('blockchainScores');
  }

  const editBtn = document.getElementById('edit-btn');
  if (editBtn) {
    editBtn.title = i18next.t('editProfile');
  }
};

const ProfilePage = new Page({
  name: 'Profile',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();
      
      setUserLanguage(userData.language, updatePageContent);

      // Front HTML elements
      const avatarEl = document.getElementById('avatar') as HTMLImageElement;
      const usernameEl = document.getElementById('username') as HTMLElement;
      const emailEl = document.getElementById('email') as HTMLElement;
      const displayNameEl = document.getElementById('displayName') as HTMLElement;
      const experienceEl = document.getElementById('experience') as HTMLElement;
      const levelEl = document.getElementById('level') as HTMLElement;
      const languageEl = document.getElementById('language') as HTMLElement;
      const onlineStatusEl = document.getElementById('onlineStatus') as HTMLElement;

      // Back HTML elements
      const tournamentHistoryEl = document.getElementById('tournamentHistory');
      const scoreListEl = document.getElementById('scoreList');

      const { avatar, username, display_name, email, experience, level, language, is_online } =
        userData as {
          avatar: string;
          username: string;
          email: string;
          display_name: string;
          experience: number;
          level: number;
          language: keyof typeof languageNames;
          is_online: boolean;
        };
      const tournamentHistory: ITournamentHistory[] = [
        { date: '2025-01-01', result: 'Won' },
        { date: '2025-01-05', result: 'Lost' },
      ];
      const blockchainScores: IBlockchainScore[] = [
        { txHash: '0x123...', score: 100 },
        { txHash: '0x456...', score: 80 },
      ];

      // Update Front HTML elements
      if (avatarEl) {
        avatarEl.src = avatar || '/src/layouts/common/avatar.png';
      }
      if (usernameEl) usernameEl.textContent = username;
      if (emailEl) emailEl.textContent = email;
      if (displayNameEl) displayNameEl.textContent = display_name;
      if (experienceEl) experienceEl.textContent = experience.toString();
      if (levelEl) levelEl.textContent = level.toString();
      if (languageEl) languageEl.textContent = languageNames[language];
      if (onlineStatusEl) onlineStatusEl.textContent = is_online ? 'Online' : 'Offline';

      // Change color of card based on level
      const cardBack = document.querySelector('.card-back') as HTMLElement;
      const cardFront = document.querySelector('.card-front') as HTMLElement;

      if (cardBack) {
        cardBack.classList.remove(
          'level-1-5',
          'level-6-10',
          'level-11-15',
          'level-16-20',
          'level-21-25'
        );

        if (level <= 5) {
          cardBack.classList.add('level-1-5');
        } else if (level <= 10) {
          cardBack.classList.add('level-6-10');
        } else if (level <= 15) {
          cardBack.classList.add('level-11-15');
        } else if (level <= 20) {
          cardBack.classList.add('level-16-20');
        } else {
          cardBack.classList.add('level-21-25');
        }
      }

      if (cardFront) {
        cardFront.classList.remove(
          'level-1-5',
          'level-6-10',
          'level-11-15',
          'level-16-20',
          'level-21-25'
        );

        if (level <= 5) {
          cardFront.classList.add('level-1-5');
        } else if (level <= 10) {
          cardFront.classList.add('level-6-10');
        } else if (level <= 15) {
          cardFront.classList.add('level-11-15');
        } else if (level <= 20) {
          cardFront.classList.add('level-16-20');
        } else {
          cardFront.classList.add('level-21-25');
        }
      }

      // Update Back HTML elements
      tournamentHistory.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.date} - ${item.result}`;
        tournamentHistoryEl?.appendChild(li);
      });
      blockchainScores.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `TxHash: ${item.txHash} | Score: ${item.score}`;
        scoreListEl?.appendChild(li);
      });

      const editBtn = document.getElementById('edit-btn');
      editBtn?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card flip
        window.location.href = '/settings/user';
      });

      const friendBtn = document.getElementById('friend-btn');
      friendBtn?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card flip
        window.location.href = '/friends';
      });

      // Add flip effect to profile card
      const profileCard = document.querySelector('.profile-card');
      if (profileCard) {
        profileCard.addEventListener('click', () => {
          const cardInner = profileCard.querySelector('.card-inner');
          cardInner?.classList.toggle('is-flipped');
        });
      }

      const frontCloseBtn = document.querySelector('.card-front .close-btn');
      if (frontCloseBtn) {
        frontCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent card flip
          window.location.href = '/modes';
        });
      }

      const backCloseBtn = document.querySelector('.card-back .close-btn');
      if (backCloseBtn) {
        backCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent card flip
          window.location.href = '/modes';
        });
      }
    } catch (error) {
      console.error('Error in mounted():', error);
    }
  },
});

export default ProfilePage;
