// frontend/src/pages/MultiPlay/index.ts
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  // ブラウザタブのタイトルを更新
  updateText('title', i18next.t('multiplay.pageTitle'));

  // メイン見出しを更新（例："Multiplayer Mode"）
  updateText('h1', i18next.t('multiplay.heading'));

  // 「Find Match」ボタンのテキストを更新
  updateText('#start-matchmaking', i18next.t('multiplay.startMatchmaking'));
};

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);
    document.getElementById('start-matchmaking')?.addEventListener('click', () => {
      window.location.href = '/multiplay/waiting';
    });
    pg.logger.info('MultiPlay page mounted');
  },
});

export default MultiPlayPage;
