import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';

const GamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/Game/index.html',
  },
  mounted: async ({ pg, user }) => {
    console.log('Tournament game page - placeholder implementation');
    // 最低限のURLパラメータ取得だけ残しておく
    const urlParams = new URLSearchParams(window.location.search);
    console.log('Game parameters:', Object.fromEntries(urlParams));
  }
});

export default GamePage;