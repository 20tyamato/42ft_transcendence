import CommonLayout from '@/layouts/common/index';
import { Layout } from './Layout';
import { Logger } from './Logger';
import { IBeforeMountRes } from '@/main';

type PageConfig = {
  html: string;
  css: string;
  layout: Layout;
};

type PageProps = {
  name: string;
  config?: Partial<PageConfig>;
  mounted?: ({ pg, ...props }: { pg: Page } & IBeforeMountRes) => Promise<any>;
};

const getDefaultConfig = (name: string, config?: Partial<PageConfig>): PageConfig => {
  return {
    html: `/src/pages/${name}/index.html`,
    css: `/src/pages/${name}/style.css`,
    layout: CommonLayout,
    ...config,
  };
};

export class Page {
  readonly config: PageConfig;
  readonly logger: Logger;
  mounted?: ({ pg, user }: { pg: Page } & IBeforeMountRes) => Promise<any>;

  constructor(props: PageProps) {
    this.config = getDefaultConfig(props.name, props.config);
    this.logger = new Logger();
    this.mounted = props.mounted;
  }

  async render() {
    const response = await fetch(this.config.html);
    const content = await response.text();

    if (this.config.css) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this.config.css;
      document.head.appendChild(link);
    }

    const layout = await this.config.layout.render();
    const contentWithLayout = layout.replace('<children />', content);
    return contentWithLayout;
  }
}
