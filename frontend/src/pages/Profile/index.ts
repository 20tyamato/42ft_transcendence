import { API_URL } from '@/config/config';
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

const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

const fetchCurrentUser = async () => {
  const response = await fetch(`${API_URL}/api/users/me/`, {
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

const ProfilePage = new Page({
  name: 'Profile',
  config: {
    layout: backHomeLayout,
  },
  mounted: async () => {
    try {
      const userData = await fetchCurrentUser();
      console.log('userData:', userData);

      const avatarEl = document.getElementById('avatar') as HTMLImageElement;
      const usernameEl = document.getElementById('username') as HTMLElement;
      const emailEl = document.getElementById('email') as HTMLElement;
      const experienceEl = document.getElementById('experience') as HTMLElement;
      const levelEl = document.getElementById('level') as HTMLElement;

      const tournamentHistoryEl = document.getElementById('tournamentHistory');
      const scoreListEl = document.getElementById('scoreList');

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

      if (avatarEl) {
        avatarEl.src = userData.avatarUrl || '/src/layouts/common/avator.png';
      }
      if (usernameEl) usernameEl.textContent = username;
      if (emailEl) emailEl.textContent = email;
      if (experienceEl) experienceEl.textContent = experience.toString();
      if (levelEl) levelEl.textContent = level.toString();

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

      const profileCard = document.querySelector('.profile-card');
      if (profileCard) {
        profileCard.addEventListener('click', () => {
          const cardInner = profileCard.querySelector('.card-inner');
          cardInner?.classList.toggle('is-flipped');
        });
      }
    } catch (error) {
      console.error('Error in mounted():', error);
    }
  },
});

export default ProfilePage;
