import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const loginButton = document.querySelector('a[href="/login"]');
    const registerButton = document.querySelector('a[href="/register"]');

    loginButton?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Login button clicked! Navigating to the login page...');
      window.location.href = '/login';
    });

    registerButton?.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Register button clicked! Navigating to the register page...');
      window.location.href = '/register';
    });
  },
});

export default HomePage;
