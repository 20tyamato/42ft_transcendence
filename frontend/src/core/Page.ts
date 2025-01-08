type PageProps = {
  htmlPath: string;
};

export class Page {
  private readonly htmlPath: string;

  constructor(props: PageProps) {
    this.htmlPath = props.htmlPath;
  }
}
