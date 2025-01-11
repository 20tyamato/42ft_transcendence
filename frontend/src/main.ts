import HomePage from '@/pages/Home/index';
import RegisterPage from '@/pages/Register/index';
import { Page } from './core/Page';
import NotFoundPage from './pages/404/index';
import LoginPage from './pages/Login/index';
import SamplePage from './pages/Sample/index';

const routes: Record<string, Page> = {
  '/': HomePage,
  '/404': NotFoundPage,
  '/register': RegisterPage,
  '/login': LoginPage,
  '/sample': SamplePage,
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

window.onpopstate = () => {
  const path = window.location.pathname;
  router(path);
};

document.addEventListener('DOMContentLoaded', () => {
  router(window.location.pathname);
});
