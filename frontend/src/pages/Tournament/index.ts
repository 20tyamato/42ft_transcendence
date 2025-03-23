import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('singlePlay.title'));
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
