import NotFoundPage from '@/pages/404/index';
import HomePage from '@/pages/Home/index';
import LeaderboardPage from '@/pages/Leaderboard/index';
import LoginPage from '@/pages/Login/index';
import ModesPage from '@/pages/Modes/index';
import MultiPlayPage from '@/pages/MultiPlay/index';
import ProfilePage from '@/pages/Profile/index';
import RegisterPage from '@/pages/Register/index';
import SinglePlayPage from '@/pages/SinglePlay/Game/index';
import SinglePlaySelectPage from '@/pages/SinglePlay/Select/index';
import TournamentPage from '@/pages/Tournament/index';
import ResultPage from './pages/Result/index';
import SettingsUserPage from './pages/Settings/User/index';
import WebSocketTestPage from '@/pages/MultiPlay/Test/index';
import WaitingPage from '@/pages/MultiPlay/Waiting/index';
import GamePage from '@/pages/MultiPlay/Game/index';

import { Page } from './core/Page';

const appDiv = document.getElementById('app');

// // ダミーのログインチェック関数（本来はトークンチェックやセッションチェックを行う）
// function isLoggedIn(): boolean {
//   // 例: localStorage に "isLoggedIn" フラグがあればログイン扱いとする
//   return localStorage.getItem('isLoggedIn') === 'true';
// }

// // シンプルなルートガードの例
// function requireAuth(targetPage: Page, fallbackPath = '/login'): Page {
//   if (isLoggedIn()) {
//     return targetPage;
//   } else {
//     return routes[fallbackPath] || NotFoundPage;
//   }
// }

// FIX: requireAuthを使うように変更する
const routes: Record<string, Page> = {
  '/': HomePage,
  '/404': NotFoundPage,
  '/register': RegisterPage,
  '/login': LoginPage,
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
  // '/games/:id/results': GameResultsPage,
  '/result': ResultPage,
  '/tournament': TournamentPage,
  // '/tournament/:id': TournamentPage,
  '/leaderboard': LeaderboardPage,
};

async function router(path: string) {
  if (!appDiv) return;

  // パスとクエリを分離
  const [pathWithoutQuery] = path.split('?');
  console.log("Router handling:", {
      fullPath: path,
      pathWithoutQuery,
      query: window.location.search
  });

  const targetPage = routes[pathWithoutQuery] ?? NotFoundPage;
  const content = await targetPage.render();
  appDiv.innerHTML = content;

  document.title = 'ft_transcendence';

  // クエリパラメータを含めた完全なURLを使用
  window.history.pushState({}, '', path);

  if (targetPage.mounted) {
      await targetPage.mounted({pg: targetPage});
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
