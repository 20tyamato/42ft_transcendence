import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SamplePage = new Page({
  name: 'Sample',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const button = document.querySelector('#random-message-button');
    const messageDisplay = document.querySelector('#random-message');

    button?.addEventListener('click', () => {
      const messages = [
        'Hello, World!',
        'Welcome to the Sample Page!',
        'You clicked the button!',
        'Have a great day!',
        'Keep exploring and learning!',
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      if (messageDisplay) {
        messageDisplay.textContent = randomMessage;
      }
    });
  },
});

export default SamplePage;
