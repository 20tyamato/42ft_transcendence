// frontend/src/pages/Tournament/Game/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { logger } from '@/core/Logger';
import { IGameConfig } from '@/models/Game/type';
import { TournamentGameManager } from '@/models/Tournament/TournamentGameManager';

const GamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/Game/index.html',
  },
  mounted: async ({ pg, user }) => {
    logger.info('Tournament Game page mounting...');

    // URLパラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    const roundType = urlParams.get('round');
    const matchNumber = urlParams.get('matchNumber');
    const sessionId = urlParams.get('session');
    const isPlayer1 = urlParams.get('isPlayer1') === 'true';
    const username = user.username;

    logger.info('Tournament game parameters:', {
      tournamentId,
      roundType,
      matchNumber,
      sessionId,
      isPlayer1,
      username,
    });

    // 必要なパラメータがない場合はトーナメントページにリダイレクト
    if (!tournamentId || !roundType || !sessionId || !username) {
      console.error('Missing required tournament game parameters');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = '/tournament';
      return;
    }

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    try {
      // WebSocketエンドポイントの構築
      // /ws/tournament/game/{round_type}/{tournament_id}/{username}/
      const wsEndpoint = `${WS_URL}/wss/tournament/game/${roundType}/${tournamentId}/${username}/`;

      // ゲーム設定の作成
      const gameConfig: IGameConfig = {
        sessionId,
        username,
        isPlayer1,
        wsEndpoint,
        moveAmount: 10,
      };

      // トーナメント情報の準備
      const tournamentInfo = {
        tournamentId,
        roundType,
        matchNumber: matchNumber ? parseInt(matchNumber) : undefined,
      };

      // ゲームマネージャーの初期化
      const gameManager = new TournamentGameManager(gameConfig, container, tournamentInfo);

      // ゲーム開始
      await gameManager.init();
      logger.info('Tournament game initialized successfully');

      // タイトル更新
      document.title = `Tournament ${roundType.startsWith('semi') ? 'Semi-Final' : 'Final'}`;

      // クリーンアップ関数を返す
      return () => {
        logger.info('Tournament game page unmounting, cleaning up resources...');
        gameManager.cleanup();
      };
    } catch (error) {
      console.error('Failed to initialize tournament game:', error);

      // エラーメッセージを表示
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = 'Failed to initialize tournament game. Please try again.';
      container.appendChild(errorElement);

      // エラーからの回復を試みる（5秒後にリダイレクト）
      setTimeout(() => {
        window.location.href = '/tournament';
      }, 5000);
    }
  },
});

export default GamePage;
