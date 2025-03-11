import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';

const WaitingPage = new Page({
  name: 'Tournament/Waiting',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/Waiting/index.html',
  },
  mounted: async ({ pg, user }) => {
    console.log('Tournament waiting page - placeholder implementation');
    
    // 戻るボタンの機能だけ実装しておく
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = '/tournament';
      });
    }
  }
});

export default WaitingPage;