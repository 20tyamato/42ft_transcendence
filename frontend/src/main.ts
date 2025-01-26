import NotFoundPage from '@/pages/404/index';
import HomePage from '@/pages/Home/index';
import LeaderboardPage from '@/pages/Leaderboard/index';
import LoginPage from '@/pages/Login/index';
import ModesPage from '@/pages/Modes/index';
import MultiPlayWaitingPage from '@/pages/MultiPlay/Waiting/index';
// import MultiPlayGamePage from '@/pages/MultiPlay/Game/index';
import ProfilePage from '@/pages/Profile/index';
import RegisterPage from '@/pages/Register/index';
import SinglePlayPage from '@/pages/SinglePlay/Game/index';
import SinglePlaySelectPage from '@/pages/SinglePlay/Select/index';
import TournamentPage from '@/pages/Tournament/index';
import ResultPage from './pages/Result/index';
import SettingsUserPage from './pages/Settings/User/index';

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
  '/settings/user': SettingsUserPage,
  '/singleplay/game': SinglePlayPage,
  '/singleplay/select': SinglePlaySelectPage,
  '/multiplay/waiting': MultiPlayWaitingPage,  // 待機画面
  // '/multiplay/game': MultiPlayGamePage,        // ゲーム画面
  '/result': ResultPage,
  '/tournament': TournamentPage,
  '/leaderboard': LeaderboardPage,
};

async function router(path: string) {
  if (!appDiv) return;

  const targetPage = routes[path] ?? NotFoundPage;
  const content = await targetPage.render();
  appDiv.innerHTML = content;

  // // ページタイトルを変更（Page.name があればそれを使う想定）
  // document.title = targetPage.name || 'ft_transcendence';
  document.title = 'ft_transcendence';

  // 履歴 API で pushState
  window.history.pushState({}, '', path);

  if (targetPage.mounted) {
    await targetPage.mounted();
  }
}

// ブラウザの戻る/進むボタン対応
window.onpopstate = () => {
  const path = window.location.pathname;
  router(path);
};

// 初回アクセス時
document.addEventListener('DOMContentLoaded', () => {
  router(window.location.pathname);
});
