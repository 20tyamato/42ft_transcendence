import NotFoundPage from '@/pages/404/index';
import HomePage from '@/pages/Home/index';
import LoginPage from '@/pages/Login/index';
import MultiPlayPage from '@/pages/MultiPlay/index';
import OpeningPage from '@/pages/Opening/index';
import QuickStartPage from '@/pages/QuickStart/index';
import RankingPage from '@/pages/Ranking/index';
import RegisterPage from '@/pages/Register/index';
import SamplePage from '@/pages/Sample/index';
import SinglePlayPage from '@/pages/SinglePlay/index';
import UserProfilePage from '@/pages/UserProfile/index';

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

const routes: Record<string, Page> = {
  '/': HomePage,
  '/404': NotFoundPage,
  '/register': RegisterPage,
  '/login': LoginPage,
  '/sample': SamplePage,
  '/opening': OpeningPage,
  '/quickstart': QuickStartPage,
  // FIXME: ちゃんと実装する
  // '/singleplay': requireAuth(SinglePlayPage),
  '/singleplay': SinglePlayPage,
  // FIXME: ちゃんと実装する
  // '/multiplay': requireAuth(MultiPlayPage),
  '/multiplay': MultiPlayPage,
  '/ranking': RankingPage,
  // FIXME: ちゃんと実装する
  // '/userprofile': requireAuth(UserProfilePage),
  '/userprofile': UserProfilePage,
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
