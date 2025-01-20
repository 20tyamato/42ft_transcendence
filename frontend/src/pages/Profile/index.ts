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
    // --- Fetchでユーザーデータを取得 ---
    const response = await fetch('http://127.0.0.1:8000/api/users/');
    const data = await response.json();
    const userData = data[0];

    // --- HTML要素を取得 ---
    const avatarEl = document.getElementById('avatar') as HTMLImageElement;
    const usernameEl = document.getElementById('username') as HTMLElement;
    const emailEl = document.getElementById('email') as HTMLElement;
    const rankingEl = document.getElementById('ranking') as HTMLElement;
    const tournamentHistoryEl = document.getElementById('tournamentHistory');
    const scoreListEl = document.getElementById('scoreList');
    const editBtn = document.getElementById('editBtn');

    // --- 取得データを変数に格納 ---
    const username = userData.username;
    const email = userData.email;
    const ranking = 5; // 仮で5を設定
    const tournamentHistory: ITournamentHistory[] = [
      { date: '2025-01-01', result: 'Won' },
      { date: '2025-01-05', result: 'Lost' },
    ];
    const blockchainScores: IBlockchainScore[] = [
      { txHash: '0x123...', score: 100 },
      { txHash: '0x456...', score: 80 },
    ];

    // --- 画面に反映 ---
    if (avatarEl) {
      // もしAPIからアバターURLを取得するなら差し替え
      // avatarEl.src = userData.avatarUrl || './api/avatars/avator.png';
    }
    usernameEl.textContent = username;
    emailEl.textContent = email;
    rankingEl.textContent = ranking.toString();

    // トーナメント履歴の描画
    tournamentHistory?.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.date} - ${item.result}`;
      tournamentHistoryEl?.appendChild(li);
    });

    // スコアの描画
    blockchainScores?.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `TxHash: ${item.txHash} | Score: ${item.score}`;
      scoreListEl?.appendChild(li);
    });

    // --- Editボタンのイベント ---
    editBtn?.addEventListener('click', () => {
      alert('Move to Profile Edit Form');
      // 別の画面に遷移させる場合はここで処理
    });

    // ▼ カードフリップのイベント ▼
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
      profileCard.addEventListener('click', () => {
        const cardInner = profileCard.querySelector('.card-inner');
        cardInner?.classList.toggle('is-flipped');
      });
    }
  },
});

export default ProfilePage;
