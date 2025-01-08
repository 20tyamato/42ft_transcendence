import CommonLayout from "@/layouts/common/index";
import { Layout } from "./Layout";

type PageConfig = {
  html: string;
  css: string;
  layout: Layout;
};

type PageProps = {
  name: string;
  config?: Partial<PageConfig>;
};

const getDefaultConfig = (
  name: string,
  config?: Partial<PageConfig>
): PageConfig => {
  return {
    html: `/src/pages/${name}/index.html`,
    css: `/src/pages/${name}/style.css`,
    layout: CommonLayout,
    ...config,
  };
};

export class Page {
  readonly config: PageConfig;

  constructor(props: PageProps) {
    this.config = getDefaultConfig(props.name, props.config);
  }

  async render() {
    const response = await fetch(this.config.html);
    let content = await response.text();

    if (this.config.css) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = this.config.css;
      document.head.appendChild(link);
    }

    const layout = await this.config.layout.render();
    const contentWithLayout = layout.replace("<children />", content);
    return contentWithLayout;
  }
}
