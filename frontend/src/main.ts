import { Page } from "./core/Page";
import HomePage from "@/pages/Home/index";
import NotFoundPage from "./pages/404/index";

type Route = {
  path: string;
  template: string;
};

const routes: Route[] = [
  { path: "/", template: "<h1>ホームページaaaa</h1><p>ようこそ！</p>" },
  {
    path: "/about",
    template: "<h1>アバウトページ</h1><p>私たちについて。</p>",
  },
  {
    path: "/contact",
    template: "<h1>コンタクトページ</h1><p>お問い合わせはこちら。</p>",
  },
];

const pages: Record<string, Page> = {
  "/": HomePage,
};

const appDiv = document.getElementById("app");

async function router(path: string) {
  if (!appDiv) return;

  const targetPage = pages[path] ?? NotFoundPage;
  console.log("kamite test", targetPage);

  const response = await fetch(targetPage.htmlPath);
  const content = await response.text();

  appDiv.innerHTML = content;
  window.history.pushState({}, "", path);
}

/** ブラウザの戻るボタンを押下時 */
window.onpopstate = () => {
  const path = window.location.pathname;
  router(path);
};

/** ページ読み込み時 */
document.addEventListener("DOMContentLoaded", () => {
  router(window.location.pathname);
});
