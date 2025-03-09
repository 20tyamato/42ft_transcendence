import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/index.html',
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    const startTournament = document.getElementById('start-tournament');
    if (startTournament) {
      startTournament.addEventListener('click', () => {
        window.location.href = '/tournament/waiting';
      });
    }
  },
});

export default TournamentPage;
