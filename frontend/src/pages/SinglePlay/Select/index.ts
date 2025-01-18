import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlaySelectPage = new Page({
  name: 'Level Selection',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const levelButtons = document.querySelectorAll('.level-button');

    levelButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const levels = ['Easy', 'Medium', 'Hard'];
        // apiで送って、Djangoゲームモデルを一個作成して、それを用いて、ゲーム画面に遷移する
      });
    });
  },
});

export default SinglePlaySelectPage;
