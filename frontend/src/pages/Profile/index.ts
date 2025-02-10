import { Page } from '@/core/Page';
import backHomeLayout from '@/layouts/backhome/index';
import { fetchCurrentUser } from '@/models/User/repository';

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
    try {
      // Front HTML elements
      const avatarEl = document.getElementById('avatar') as HTMLImageElement;
      const usernameEl = document.getElementById('username') as HTMLElement;
      const emailEl = document.getElementById('email') as HTMLElement;
      const experienceEl = document.getElementById('experience') as HTMLElement;
      const levelEl = document.getElementById('level') as HTMLElement;

      // Back HTML elements
      const tournamentHistoryEl = document.getElementById('tournamentHistory');
      const scoreListEl = document.getElementById('scoreList');

      // User Data from Backend
      const userData = await fetchCurrentUser();

      const { avatar, username, email, experience, level } = userData
      const tournamentHistory: ITournamentHistory[] = [
        { date: '2025-01-01', result: 'Won' },
        { date: '2025-01-05', result: 'Lost' },
      ];
      const blockchainScores: IBlockchainScore[] = [
        { txHash: '0x123...', score: 100 },
        { txHash: '0x456...', score: 80 },
      ];

      // Update Front HTML elements
      if (avatarEl) {
        avatarEl.src = avatar || '/src/layouts/common/avatar.png';
      }
      if (usernameEl) usernameEl.textContent = username;
      if (emailEl) emailEl.textContent = email;
      if (experienceEl) experienceEl.textContent = experience.toString();
      if (levelEl) levelEl.textContent = level.toString();

      // Change color of card based on level
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

      // Update Back HTML elements
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

      // Add flip effect to profile card
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
