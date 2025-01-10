import HomePage from '@/pages/Home/index';
import RegisterPage from '@/pages/Register/index';
import { Page } from './core/Page';
import NotFoundPage from './pages/404/index';

const routes: Record<string, Page> = {
  '/': HomePage,
  '/404': NotFoundPage,
  '/register': RegisterPage,
};

const appDiv = document.getElementById('app');

async function router(path: string) {
  if (!appDiv) return;

  const targetPage = routes[path] ?? NotFoundPage;
  const content = await targetPage.render();

  appDiv.innerHTML = content;
  window.history.pushState({}, '', path);

  if (targetPage.mounted) {
    await targetPage.mounted();
  }
}

/** ブラウザの戻るボタンを押下時 */
window.onpopstate = () => {
  const path = window.location.pathname;
  router(path);
};

/** ページ読み込み時 */
document.addEventListener('DOMContentLoaded', () => {
  router(window.location.pathname);
});
