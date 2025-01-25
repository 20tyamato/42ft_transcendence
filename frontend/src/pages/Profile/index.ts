import { Page } from '@/core/Page';
import backHomeLayout from '@/layouts/backhome/index';

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
    layout: backHomeLayout,
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
    const experienceEl = document.getElementById('experience') as HTMLElement;
    const tournamentHistoryEl = document.getElementById('tournamentHistory');
    const scoreListEl = document.getElementById('scoreList');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarUploadInput = document.getElementById('avatarUpload') as HTMLInputElement;

    // --- 取得データを変数に格納 (例) ---
    const username = userData.username;
    const email = userData.email;
    const experience = userData.experience;
    const level = userData.level;
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
      avatarEl.src = userData.avatarUrl || '/src/layouts/common/avator.png';
    }
    if (usernameEl) usernameEl.textContent = username;
    if (emailEl) emailEl.textContent = email;
    if (experienceEl) experienceEl.textContent = experience.toString();
    if (level) level.textContent = level.toString();

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

    // ▼ カードフリップのイベント ▼
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
      profileCard.addEventListener('click', () => {
        const cardInner = profileCard.querySelector('.card-inner');
        cardInner?.classList.toggle('is-flipped');
      });
    }

    // ▼ アバターアップロード機能 ▼
    avatarUploadBtn?.addEventListener('click', () => {
      avatarUploadInput?.click();
    });

    avatarUploadInput?.addEventListener('change', () => {
      if (!avatarUploadInput.files || avatarUploadInput.files.length === 0) return;
      const file = avatarUploadInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (avatarEl && e.target) {
          avatarEl.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });
  },
});

export default ProfilePage;
