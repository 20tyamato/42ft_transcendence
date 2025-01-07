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

const appDiv = document.getElementById("app");

function navigate(path: string) {
  const route = routes.find((r) => r.path === path);
  if (route && appDiv) {
    appDiv.innerHTML = route.template;
    window.history.pushState({}, "", path);
  }
}

window.onpopstate = () => {
  const path = window.location.pathname;
  navigate(path);
};

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const path = (event.target as HTMLAnchorElement).getAttribute("href");
      if (path) {
        navigate(path);
      }
    });
  });

  navigate(window.location.pathname);
});
