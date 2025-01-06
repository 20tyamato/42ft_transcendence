import * as path from "path";
import * as fs from "fs/promises";

/**
 * HTMLファイルを読み込む
 * @param _htmlPath HTMLファイルのパス
 * @returns HTMLファイルの内容
 */
export const readHTMLfile = async (_htmlPath: string): Promise<string> => {
  const absolutePath = path.join(__dirname, "..", _htmlPath);
  try {
    return await fs.readFile(absolutePath, "utf-8");
  } catch (error) {
    console.error(`HTMLファイルの読み込みに失敗しました: ${error}`);
    return "<div>エラーが発生しました</div>";
  }
};
