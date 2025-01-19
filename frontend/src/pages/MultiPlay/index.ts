import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const step1 = document.getElementById('step1') as HTMLElement;
    const step2 = document.getElementById('step2') as HTMLElement;
    const step3 = document.getElementById('step3') as HTMLElement;
    const step4 = document.getElementById('step4') as HTMLElement;
    const matchArea = document.getElementById('matchArea') as HTMLElement;
    const resultArea = document.getElementById('resultArea') as HTMLElement;

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const setPlayerCountBtn = document.getElementById('setPlayerCountBtn');
    const loginCompleteBtn = document.getElementById('loginCompleteBtn');
    const startTournamentBtn = document.getElementById('startTournamentBtn');
    const finishTournamentBtn = document.getElementById('finishTournamentBtn');
    const retryBtn = document.getElementById('retryBtn');
    const exitBtn = document.getElementById('exitBtn');

    yesBtn?.addEventListener('click', () => {
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
    });

    noBtn?.addEventListener('click', () => {
      alert('Please register users first.');
      window.location.href = '/register';
    });

    setPlayerCountBtn?.addEventListener('click', () => {
      const playerCountInput = document.getElementById('playerCount') as HTMLInputElement;
      const count = Number(playerCountInput.value);

      if (count < 3 || count > 8) {
        alert('Player count must be between 3 and 8!');
        return;
      }
      alert(`Number of players: ${count}`);
      step2.classList.add('hidden');
      step3.classList.remove('hidden');
    });

    loginCompleteBtn?.addEventListener('click', () => {
      alert('All players logged in!');
      step3.classList.add('hidden');
      step4.classList.remove('hidden');
    });

    startTournamentBtn?.addEventListener('click', () => {
      step4.classList.add('hidden');
      matchArea.classList.remove('hidden');
    });

    finishTournamentBtn?.addEventListener('click', () => {
      alert('All matches finished. Generating ranking...');
      matchArea.classList.add('hidden');
      resultArea.classList.remove('hidden');
    });

    retryBtn?.addEventListener('click', () => {
      window.location.reload();
    });

    exitBtn?.addEventListener('click', () => {
      window.location.href = '/modes';
    });
  },
});

export default MultiPlayPage;
