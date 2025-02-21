// frontend/src/pages/Tournament/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import './style.css';

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/index.html',
  },
  mounted: () => {
    const startTournament = document.getElementById('start-tournament');
    if (startTournament) {
      startTournament.addEventListener('click', () => {
        window.location.href = '/tournament/waiting';
      });
    }
  },
});

export default TournamentPage;