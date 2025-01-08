import { Page } from "./core/Page";
import HomePage from "@/pages/Home/index";

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

function router(path: string) {
  const route = routes.find((r) => r.path === path);
  if (!route || !appDiv) return;

  // console.log("kamite test", HomePage);

  // console.log("kamite test", pages[path]);

  appDiv.innerHTML = route.template;
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
