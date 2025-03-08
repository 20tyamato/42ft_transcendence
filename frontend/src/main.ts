import NotFoundPage from '@/pages/404/index';
import HomePage from '@/pages/Home/index';
import LeaderboardPage from '@/pages/Leaderboard/index';
import LoginPage from '@/pages/Login/index';
import ModesPage from '@/pages/Modes/index';
import GamePage from '@/pages/MultiPlay/Game/index';
import MultiPlayPage from '@/pages/MultiPlay/index';
import WebSocketTestPage from '@/pages/MultiPlay/Test/index';
import WaitingPage from '@/pages/MultiPlay/Waiting/index';
import ProfilePage from '@/pages/Profile/index';
import RegisterPage from '@/pages/Register/index';
import SinglePlayPage from '@/pages/SinglePlay/Game/index';
import SinglePlaySelectPage from '@/pages/SinglePlay/Select/index';
import FriendsPage from './pages/Friends/index';
import LogoutPage from './pages/Logout';
import ResultPage from './pages/Result/index';
import SettingsUserPage from './pages/Settings/User/index';
import TournamentPage from './pages/Tournament';
import TournamentWaitingPage from './pages/Tournament/Waiting';
import TournamentGamePage from './pages/Tournament/Game/index';

import { Page } from './core/Page';
import { ICurrentUser } from './libs/Auth/currnetUser';

export type IBeforeMountRes = { user: ICurrentUser };

const appDiv = document.getElementById('app');

// FIX: requireAuthを使うように変更する
const routes: Record<string, Page> = {
  '/': HomePage,
  '/404': NotFoundPage,
  '/register': RegisterPage,
  '/login': LoginPage,
  '/logout': LogoutPage,
  '/profile': ProfilePage,
  '/modes': ModesPage,
  // '/settings/game': SettingsGamePage,
  '/settings/user': SettingsUserPage,
  '/singleplay/game': SinglePlayPage,
  '/singleplay/select': SinglePlaySelectPage,
  '/multiplay': MultiPlayPage,
  '/multiplay/test': WebSocketTestPage,
  '/multiplay/waiting': WaitingPage,
  '/multiplay/game': GamePage,
  '/result': ResultPage,
  '/tournament': TournamentPage,
  '/tournament/waiting': TournamentWaitingPage,
  '/tournament/game': TournamentGamePage,
  '/leaderboard': LeaderboardPage,
  '/friends': FriendsPage,
};

async function router(path: string) {
  if (!appDiv) return;
  const [pathWithoutQuery] = path.split('?');
  console.log('Router handling:', {
    fullPath: path,
    pathWithoutQuery,
    query: window.location.search,
  });

  const targetPage = routes[pathWithoutQuery] ?? NotFoundPage;

  let beforeMountRes: IBeforeMountRes;
  if (targetPage.config.layout.beforeMounted) {
    beforeMountRes = await targetPage.config.layout.beforeMounted();
  }

  const content = await targetPage.render();
  appDiv.innerHTML = content;
  document.title = 'ft_transcendence';
  // replaceStateを使用してブラウザの履歴を適切に管理
  if (!window.location.pathname.startsWith('/multiplay/game')) {
    window.history.pushState({}, '', path);
  }
  if (targetPage.config.layout.mounted) {
    await targetPage.config.layout.mounted({ ...beforeMountRes! });
  }
  if (targetPage.mounted) {
    await targetPage.mounted({ pg: targetPage, ...beforeMountRes! });
  }
}

// ブラウザの戻る/進むボタン対応
window.onpopstate = () => {
  const path = window.location.pathname + window.location.search;
  router(path);
};

// 初回アクセス時
document.addEventListener('DOMContentLoaded', () => {
  router(window.location.pathname + window.location.search);
});
