// frontend/src/pages/Result/index.ts

import { Page } from '@/core/Page';
import { GameResultService } from '@/models/Result/GameResultService';
import { ResultPageUI } from '@/models/Result/ResultPageUI';
import { createMultiplayerGame, createTournamentGame } from '@/models/Game/repository';
import AuthLayout from '@/layouts/AuthLayout';

/**
 * 結果画面ページコンポーネント
 * 全体のフローを制御し、各サービスを連携
 */
const ResultPage = new Page({
  name: 'Result',
  config: {
    layout: AuthLayout,
  },
  mounted: async ({ pg, user }): Promise<void> => {
    // 結果データ取得
    const resultData = GameResultService.getStoredResult();
    if (!resultData) {
      console.warn('No game result data found');
      return;
    }

    const { score, gameMode } = resultData;

    // UI初期化
    const ui = new ResultPageUI();

    // 終了ボタン設定
    ui.setupEventHandlers(() => {
      window.location.href = '/modes';
    });

    // 勝敗判定
    const winnerInfo = GameResultService.determineWinner(score, user.username);

    // 画面表示更新
    await ui.updateResultView(score, user.username, {
      message: winnerInfo.message,
      className: winnerInfo.className,
    });

    // 結果をサーバーに送信
    try {
      gameMode === 'multiplayer'
        ? await createMultiplayerGame({
            player1Score: score.player1,
            player2Score: score.player2,
            opponentName: score.opponent || '',
          })
        : await createTournamentGame({
            playerScore: score.player1,
          });
    } catch (error) {
      console.error('Error saving game result:', error);
    }

    // 保存データのクリア
    GameResultService.clearStoredResult();
  },
});

export default ResultPage;
