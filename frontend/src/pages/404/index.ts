import { Page } from "@/core/Page";

const NotFoundPage = new Page({
  htmlPath: "pages/404/index.html",
  mounted: async () => {
    console.log("NotFoundPage rendered!!!!!!!");
  },
});

export default NotFoundPage;
