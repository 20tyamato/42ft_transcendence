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

const updatePageContent = () => {
  const titleEl = document.querySelector('.ranking-container h1');
  if (titleEl) titleEl.textContent = i18next.t('leaderboard');

  const saveButton = document.querySelector('.btn');
  if (saveButton) saveButton.textContent = i18next.t('backToHome');
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
      
      setUserLanguage(userData.language, updatePageContent);

      const users: IRankingUser[] = await fetchUsers();
      const sortedUsers = users.sort((a, b) => b.level - a.level).slice(0, 10);

      sortedUsers.forEach((user, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank">${index + 1}</span> ${user.username} - Lv. ${user.level}`;
        rankingList?.appendChild(li);
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      if (rankingList) {
        const li = document.createElement('li');
        li.innerText = 'Failed to fetch users';
        rankingList.appendChild(li);
      }
    }

    backBtn?.addEventListener('click', () => {
      window.location.href = '/modes';
    });

    pg.logger.info('LeaderboardPage mounted!');
  },
});

export default LeaderboardPage;
