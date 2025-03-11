import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';

const WaitingNextMatchPage = new Page({
  name: 'Tournament/WaitingNextMatch',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/WaitingNextMatch/index.html',
  },
  mounted: async ({ pg, user }) => {
    console.log('Tournament waiting next match page - placeholder implementation');
    
    // 戻るボタンの機能だけ実装しておく
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = '/tournament';
      });
    }
  }
});

export default WaitingNextMatchPage;