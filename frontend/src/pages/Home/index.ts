import { Page } from "../../core/Page";

const HomePage = new Page({
  htmlPath: "pages/Home/index.html",
  mounted: async () => {
    console.log("HomePage rendered!!!!!!!");
  },
});

export default HomePage;
