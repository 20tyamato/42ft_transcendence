import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

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

    const topTen: IRankingUser[] = [
      { username: 'Alice', level: 10 },
      { username: 'Bob', level: 8 },
      { username: 'Carol', level: 6 },
      { username: 'Dave', level: 6 },
      { username: 'Eve', level: 5 },
      { username: 'Frank', level: 4 },
      { username: 'Grace', level: 3 },
      { username: 'Heidi', level: 3 },
      { username: 'Ivan', level: 2 },
      { username: 'Judy', level: 1 },
    ];

    topTen.forEach((user, index) => {
      const li = document.createElement('li');
      li.textContent = `#${index + 1} ${user.username} - Lv. ${user.level}`;
      rankingList?.appendChild(li);
    });

    backBtn?.addEventListener('click', () => {
      window.location.href = '/';
    });
  },
});

export default LeaderboardPage;
