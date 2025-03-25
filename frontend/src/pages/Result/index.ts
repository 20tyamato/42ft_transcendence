// frontend/src/pages/Result/index.ts
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { GameResultService } from '@/models/Result/GameResultService';
import { ResultPageUI } from '@/models/Result/ResultPageUI';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('result.pageTitle'));
  updateText('.results-container h1', i18next.t('result.resultTitle'));
  updateText('#result-message', i18next.t('result.resultMessage'));
  updateText('#exitBtn', i18next.t('result.exitButton'));
};

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
    setUserLanguage(user.language, updatePageContent);
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

    // 保存データのクリア
    GameResultService.clearStoredResult();
  },
});

export default ResultPage;
