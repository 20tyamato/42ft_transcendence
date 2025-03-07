// frontend/src/pages/Tournament/Game/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { TournamentGameManager } from '@/models/Tournament/TournamentGameManager';
import { IGameConfig } from '@/models/interface';
import { checkUserAccess } from '@/models/User/auth';

const GamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/Game/index.html',
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    console.log('Tournament game page mounting...');
    
    // 認証チェック
    checkUserAccess();

    // URLパラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const isPlayer1Str = urlParams.get('isPlayer1');
    const matchId = urlParams.get('matchId');
    const roundStr = urlParams.get('round');
    const username = localStorage.getItem('username');

    // パラメータのログ出力
    console.log('Game parameters:', { 
      sessionId, 
      isPlayer1: isPlayer1Str, 
      matchId,
      round: roundStr,
      username 
    });

    // 必要なパラメータがない場合はトーナメントページにリダイレクト
    if (!sessionId || !username || isPlayer1Str === null || !matchId || roundStr === null) {
      console.error('Missing required game parameters');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = '/tournament';
      return;
    }

    const isPlayer1 = isPlayer1Str === 'true';
    const round = parseInt(roundStr, 10);

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    try {
      // WebSocketエンドポイントの決定
      let wsEndpoint = '';
      if (round === 0) {
        // 準決勝
        wsEndpoint = `${WS_URL}/ws/tournament/semi-final/${sessionId}/${username}/`;
      } else {
        // 決勝
        wsEndpoint = `${WS_URL}/ws/tournament/final/${sessionId}/${username}/`;
      }

      // ゲーム設定の作成
      const gameConfig: IGameConfig = {
        sessionId,
        username,
        isPlayer1,
        wsEndpoint,
        moveAmount: 10,
      };

      // ゲームマネージャーの初期化
      const gameManager = new TournamentGameManager(gameConfig, container, matchId, round);

      // ゲーム開始
      await gameManager.init();
      console.log('Tournament game initialized successfully');

      // ラウンド表示の更新
      const roundDisplay = document.getElementById('round-display');
      if (roundDisplay) {
        roundDisplay.textContent = round === 0 ? 'Semi-Final' : 'Final';
      }

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