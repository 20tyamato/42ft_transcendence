// frontend/src/pages/Result/index.ts

import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import { GameResultService } from '@/models/Result/GameResultService';
import { ResultPageUI } from '@/models/Result/ResultPageUI';

/**
 * 結果画面ページコンポーネント
 * 全体のフローを制御し、各サービスを連携
 */
const ResultPage = new Page({
  name: 'Result',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    // 認証チェック
    checkUserAccess();
    
    // ユーザー名取得
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage');
      window.location.href = '/';
      return;
    }
    
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
    const winnerInfo = GameResultService.determineWinner(score, username);
    
    // 画面表示更新
    await ui.updateResultView(score, username, {
      message: winnerInfo.message,
      className: winnerInfo.className,
    });
    
    // 結果をサーバーに送信
    try {
      await GameResultService.sendGameResult(score, gameMode);
    } catch (error) {
      console.error('Error saving game result:', error);
    }
    
    // 保存データのクリア
    GameResultService.clearStoredResult();
  },
});

export default ResultPage;