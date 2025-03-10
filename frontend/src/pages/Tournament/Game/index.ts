// frontend/src/pages/Tournament/Game/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import { TournamentGameManager } from '@/models/Tournament/TournamentGameManager';
import { IGameConfig } from '@/models/Game/type';
import AuthLayout from '@/layouts/AuthLayout';

const GamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/Game/index.html',
  },
  mounted: async ({ pg, user }) => {
    console.log('Tournament game page mounting...');

    // URLパラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    const roundType = urlParams.get('round') || 'semi1';
    const isPlayer1Str = urlParams.get('isPlayer1');
    const username = user.username;

    // パラメータのログ出力
    console.log('Game parameters:', {
      tournamentId,
      isPlayer1: isPlayer1Str,
      roundType,
      username: user.username,
    });

    // 必要なパラメータがない場合はトーナメントページにリダイレクト
    if (!tournamentId || isPlayer1Str === null) {
      console.error('Missing required game parameters');
      window.location.href = '/tournament';
      return;
    }

    const isPlayer1 = isPlayer1Str === 'true';

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    try {
      // WebSocketエンドポイントの決定
      const wsEndpoint = `${WS_URL}/ws/tournament/game/${roundType}/${tournamentId}/${username}/`;

      // ゲーム設定の作成
      const gameConfig: IGameConfig = {
        sessionId: `tournament_${tournamentId}_${roundType}_${username}_opponent_${Date.now()}`,
        username,
        isPlayer1,
        wsEndpoint,
        moveAmount: 10,
      };

      // ゲームマネージャーの初期化
      const gameManager = new TournamentGameManager(gameConfig, container, roundType);

      // ゲーム開始
      await gameManager.init();
      console.log('Tournament game initialized successfully');

      // FIXME: 3/9 こちらの機能をupdateする
      // ラウンド表示の更新
      // const roundDisplay = document.getElementById('round-display');
      // if (roundDisplay) {
      //   roundDisplay.textContent = round === 0 ? 'Semi-Final' : 'Final';
      // }

      // UIの追加要素の設定
      const playerName = document.getElementById('player-name');
      if (playerName) {
        playerName.textContent = username;
      }

      // クリーンアップ関数を返す
      return () => {
        console.log('Tournament game page unmounting, cleaning up resources...');
        gameManager.cleanup();
      };
    } catch (error) {
      console.error('Failed to initialize tournament game:', error);
      // エラーメッセージを表示
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = 'Failed to initialize game. Please try again.';
      container.appendChild(errorElement);

      // エラーからの回復を試みる（5秒後にリダイレクト）
      setTimeout(() => {
        window.location.href = '/tournament';
      }, 5000);
    }
  },
});

export default GamePage;
