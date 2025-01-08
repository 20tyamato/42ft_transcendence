type PageProps = {
  htmlPath: string;
};

export class Page {
  readonly htmlPath: string;

  constructor(props: PageProps) {
    this.htmlPath = props.htmlPath;
  }
}
