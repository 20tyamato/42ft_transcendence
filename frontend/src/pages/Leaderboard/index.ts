import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser, fetchUsers } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import i18next from 'i18next';

interface IRankingUser {
  username: string;
  level: number;
}

const updatePageContent = (): void => {
  updateTitle();
  updateBackButtonText();
};

const updateTitle = (): void => {
  const titleEl = document.querySelector('.ranking-container h1');
  if (titleEl) {
    titleEl.textContent = i18next.t('leaderboard');
  }
};

const updateBackButtonText = (): void => {
  const saveButton = document.querySelector('.btn');
  if (saveButton) {
    saveButton.textContent = i18next.t('backToHome');
  }
};

const renderRankingList = (users: IRankingUser[], rankingList: HTMLElement): void => {
  const sortedUsers = users
    .sort((a, b) => b.level - a.level)
    .slice(0, 10);

  sortedUsers.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="rank">${index + 1}</span> ${user.username} - Lv. ${user.level}`;
    rankingList.appendChild(li);
  });
};

const showRankingError = (rankingList: HTMLElement, message: string): void => {
  const li = document.createElement('li');
  li.innerText = message;
  rankingList.appendChild(li);
};

const initBackButton = (backBtn: HTMLElement | null): void => {
  backBtn?.addEventListener('click', () => {
    window.location.href = '/modes';
  });
};

const LeaderboardPage = new Page({
  name: 'Leaderboard',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    const rankingList = document.getElementById('rankingList');
    const backBtn = document.getElementById('backBtn');

    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();

      // 言語設定とページ文言の更新
      setUserLanguage(userData.language, updatePageContent);

      // ランキングデータの取得とレンダリング
      const users: IRankingUser[] = await fetchUsers();
      if (rankingList) {
        renderRankingList(users, rankingList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (rankingList) {
        showRankingError(rankingList, i18next.t('failedToFetchUsers') || 'Failed to fetch users');
      }
    }

    initBackButton(backBtn);
    pg.logger.info('LeaderboardPage mounted!');
  },
});

export default LeaderboardPage;
