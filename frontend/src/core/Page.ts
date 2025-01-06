import * as path from "path";
import * as fs from "fs/promises";

interface PageProps {
  htmlPath: string;
  mounted?: () => Promise<void>;
}

/**
 * Pageを管理するクラス
 */
export class Page {
  private _htmlPath: string;
  private _mounted?: () => Promise<void>;

  constructor({ htmlPath, mounted }: PageProps) {
    this._htmlPath = htmlPath;
    this._mounted = mounted;
  }

  /**
   * HTMLファイルを読み込む
   * @returns HTMLファイルの内容
   */
  async render() {
    const absolutePath = path.join(__dirname, "..", this._htmlPath);
    try {
      return await fs.readFile(absolutePath, "utf-8");
    } catch (error) {
      console.error(`HTMLファイルの読み込みに失敗しました: ${error}`);
      return "<div>エラーが発生しました</div>";
    }
  }

  /**
   * マウント処理を実行する
   */
  async mounted() {
    if (!this._mounted) return;

    await this._mounted();
  }
}
