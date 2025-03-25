import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { IRankingUser } from '@/models/interface';
import { fetchUsers } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('h1', i18next.t('leaderboard'));
  updateText('.btn', i18next.t('backToHome'));
};

const renderRankingList = (users: IRankingUser[], rankingList: HTMLElement): void => {
  const sortedUsers = users.sort((a, b) => b.level - a.level).slice(0, 10);

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

const registerBackButton = (backBtn: HTMLElement | null): void => {
  backBtn?.addEventListener('click', () => {
    window.location.href = '/modes';
  });
};

const LeaderboardPage = new Page({
  name: 'Leaderboard',
  config: {
    layout: AuthLayout,
  },
  mounted: async ({ pg, user }): Promise<void> => {
    const rankingList = document.getElementById('rankingList');
    const backBtn = document.getElementById('backBtn');

    setUserLanguage(user.language, updatePageContent);

    try {
      const users: IRankingUser[] = await fetchUsers();
      if (rankingList) {
        renderRankingList(users, rankingList);
      }
    } catch (error) {
      pg.logger.error('Error fetching users:', error);
      if (rankingList) {
        showRankingError(rankingList, i18next.t('failedToFetchUsers') || 'Failed to fetch users');
      }
    }

    registerBackButton(backBtn);
    pg.logger.info('LeaderboardPage mounted!');
  },
});

export default LeaderboardPage;
