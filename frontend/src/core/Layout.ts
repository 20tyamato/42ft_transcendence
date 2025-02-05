import { Logger } from "./Logger";

type LayoutConfig = {
  html: string;
  css: string;
};

type LayoutProps = {
  name: string;
  config?: Partial<LayoutConfig>;
};

const getDefaultConfig = (name: string, config?: Partial<LayoutConfig>): LayoutConfig => {
  return {
    html: `/src/layouts/${name}/index.html`,
    css: `/src/layouts/${name}/style.css`,
    ...config,
  };
};

export class Layout {
  readonly config: LayoutConfig;
  readonly logger: Logger;

  constructor(props: LayoutProps) {
    this.config = getDefaultConfig(props.name, props.config);
    this.logger = new Logger();
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

    return content;
  }
}
