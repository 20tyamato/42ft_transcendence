import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  // ページタイトルの更新
  updateText('title', i18next.t('tournament.title'));

  // ページ内のタイトル（h1）の更新
  updateText('.tournament-title', i18next.t('tournament.heading'));

  // 説明文の更新
  updateText('.tournament-info p', i18next.t('tournament.info'));

  // トーナメント参加ボタンのテキスト更新
  updateText('#start-tournament', i18next.t('tournament.startButton'));
};

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/index.html',
  },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);
    const startTournament = document.getElementById('start-tournament');
    if (startTournament) {
      startTournament.addEventListener('click', () => {
        window.location.href = '/tournament/waiting';
      });
    }
  },
});

export default TournamentPage;
