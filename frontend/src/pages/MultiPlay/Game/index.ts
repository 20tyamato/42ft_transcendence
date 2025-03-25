// frontend/src/pages/MultiPlay/Game/index.ts
import { WS_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { IGameConfig } from '@/models/Game/type';
import { MultiplayerGameManager } from '@/models/MultiPlay/MultiplayerGameManager';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('multiplay.game.pageTitle'));
  updateText('#game-over h1', i18next.t('multiplay.game.gameOverTitle'));
  updateText('#game-over p', i18next.t('multiplay.game.winnerText'));
  updateText('#exit-btn', i18next.t('multiplay.game.exitButton'));
};

const GamePage = new Page({
  name: 'MultiPlay/Game',
  config: {
    layout: AuthLayout,
  },
  mounted: async ({ pg, user }): Promise<void> => {
    setUserLanguage(user.language, updatePageContent);
    pg.logger.info('Game page mounting...');

    // URLパラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const isPlayer1 = urlParams.get('isPlayer1') === 'true';
    const username = user.username;

    pg.logger.info('Game parameters:', { sessionId, isPlayer1, username });

    // 必要なパラメータがない場合はゲーム選択ページにリダイレクト
    if (!sessionId || !username) {
      console.error('Missing required game parameters');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = '/multiplay';
      return;
    }

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    try {
      // ゲーム設定の作成
      const gameConfig: IGameConfig = {
        sessionId,
        username,
        isPlayer1,
        wsEndpoint: `${WS_URL}/wss/game/${sessionId}/${username}/`,
        moveAmount: 10,
      };

      // ゲームマネージャーの初期化
      const gameManager = new MultiplayerGameManager(gameConfig, container);

      // ゲーム開始
      await gameManager.init();
      pg.logger.info('Game initialized successfully');
      // クリーンアップ関数を返す
      return () => {
        pg.logger.info('Game page unmounting, cleaning up resources...');
        gameManager.cleanup();
      };
    } catch (error) {
      console.error('Failed to initialize game:', error);
      // エラーメッセージを表示
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = 'Failed to initialize game. Please try again.';
      container.appendChild(errorElement);

      // エラーからの回復を試みる（5秒後にリダイレクト）
      setTimeout(() => {
        window.location.href = '/multiplay';
      }, 5000);
    }
  },
});

export default GamePage;
