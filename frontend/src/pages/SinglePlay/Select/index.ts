import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const SinglePlaySelectPage = new Page({
  name: 'SinglePlay/Select',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    const levelButtons = document.querySelectorAll('.level-button');
    const levels = ['Easy', 'Medium', 'Hard'];

    levelButtons.forEach((button, index) => {
      button.addEventListener('click', async () => {
        const selectedLevel = levels[index];

        try {
          // Django 側のエンドポイントに POST リクエスト
          const response = await fetch('http://127.0.0.1:8000/api/games/create/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 認証が必要なら、Cookie 認証や JWT 認証ヘッダの付与が必要
            },
            body: JSON.stringify({
              level: selectedLevel,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create game');
          }

          const data = await response.json();
          // data は { game_id: <作成された Game のID> } の想定

          // 取得したゲームIDを使ってゲーム画面に遷移
          // ここはルーティングの仕組みに合わせて変えてください
          window.location.href = `/game/${data.game_id}/?level=${selectedLevel}`;

        } catch (error) {
          console.error(error);
          // エラー表示など必要に応じて実装
        }
      });
    });
  },
});

export default SinglePlaySelectPage;
