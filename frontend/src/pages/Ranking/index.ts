import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

interface IRankingUser {
  username: string;
  score: number;
}

const RankingPage = new Page({
  name: 'Ranking',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const rankingList = document.getElementById('rankingList');
    const backBtn = document.getElementById('backBtn');

    // ダミーデータ（本来はAPIやDBなどから取得）
    const topTen: IRankingUser[] = [
      { username: 'Alice', score: 1000 },
      { username: 'Bob', score: 950 },
      { username: 'Carol', score: 900 },
      { username: 'Dave', score: 850 },
      { username: 'Eve', score: 800 },
      { username: 'Frank', score: 750 },
      { username: 'Grace', score: 700 },
      { username: 'Heidi', score: 650 },
      { username: 'Ivan', score: 600 },
      { username: 'Judy', score: 550 },
    ];

    topTen.forEach((user, index) => {
      const li = document.createElement('li');
      li.textContent = `#${index + 1} ${user.username} - ${user.score} pts`;
      rankingList?.appendChild(li);
    });

    backBtn?.addEventListener('click', () => {
      window.location.href = '/opening';
    });
  },
});

export default RankingPage;
