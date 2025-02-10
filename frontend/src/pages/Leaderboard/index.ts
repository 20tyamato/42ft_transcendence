import { API_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const token = localStorage.getItem('token');

const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/api/users/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
};

interface IRankingUser {
  username: string;
  level: number;
}

const LeaderboardPage = new Page({
  name: 'Leaderboard',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const rankingList = document.getElementById('rankingList');
    const backBtn = document.getElementById('backBtn');

    try {
      const users: IRankingUser[] = await fetchUsers();
      console.log(users);

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
  },
});

export default LeaderboardPage;
