import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

interface ITournamentHistory {
  date: string;
  result: string;
}

interface IBlockchainScore {
  txHash: string;
  score: number;
}

const ProfilePage = new Page({
  name: 'Profile',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const response = await fetch('http://127.0.0.1:8000/api/users/');
    const data = await response.json();
    const userData = data[0];
    const usernameEl = document.getElementById('username') as HTMLElement;
    const emailEl = document.getElementById('email') as HTMLElement;
    const rankingEl = document.getElementById('ranking') as HTMLElement;
    const tournamentHistoryEl = document.getElementById('tournamentHistory');
    const scoreListEl = document.getElementById('scoreList');
    const editBtn = document.getElementById('editBtn');

    const username = userData.username;
    const email = userData.email;
    const ranking = 5;
    const tournamentHistory: ITournamentHistory[] = [
      { date: '2025-01-01', result: 'Won' },
      { date: '2025-01-05', result: 'Lost' },
    ];
    const blockchainScores: IBlockchainScore[] = [
      { txHash: '0x123...', score: 100 },
      { txHash: '0x456...', score: 80 },
    ];
    // 画面に反映
    usernameEl.textContent = username;
    emailEl.textContent = email;
    rankingEl.textContent = ranking.toString();
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

    editBtn?.addEventListener('click', () => {
      alert('Move to Profile Edit Form');
      // ここで別画面に飛ばす等
    });
  },
});

export default ProfilePage;
