// frontend/src/pages/Tournament/Game/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const GamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/Game/index.html',
  },
  mounted: async () => {
    console.log('Tournament game page mounted');
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Parameters:', {
      session: urlParams.get('session'),
      isPlayer1: urlParams.get('isPlayer1'),
      matchId: urlParams.get('matchId'),
      round: urlParams.get('round'),
    });
  },
});

export default GamePage;
