import * as path from "path";
import * as fs from "fs/promises";
import { readHTMLfile } from "../utils/file";

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
  async render(): Promise<string> {
    return await readHTMLfile(this._htmlPath);
  }

  /**
   * マウント処理を実行する
   */
  async mounted() {
    if (!this._mounted) return;

    await this._mounted();
  }
}
