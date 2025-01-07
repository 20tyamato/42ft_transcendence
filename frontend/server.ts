import { createServer, IncomingMessage, ServerResponse } from "http";

import { readHTMLfile } from "./src/utils/file";
import NotFoundPage from "./src/pages/404";
import HomePage from "@/pages/Home";
import { Page } from "@/core/Page";
import path from "path";
import { readFile } from "fs/promises";

const PORT: number = 3000;

const routes: Record<string, Page> = {
  "/": HomePage,
};

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = req.url ?? "/";

      // 静的ファイルのリクエストを処理
      if (url.includes(".")) {
        const contentType = getContentType(url);
        try {
          const filePath = path.join(__dirname, "public", url);
          const content = await readFile(filePath);
          res.writeHead(200, { "Content-Type": contentType });
          res.end(content);
          return;
        } catch (error) {
          console.error(`Static file error: ${error}`);
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("File not found");
          return;
        }
      }

      // ページレンダリングの処理
      const indexHTML = await readHTMLfile("../public/index.html");
      const page = routes[url] ? routes[url] : NotFoundPage;
      const html = await page.render();

      const result = indexHTML.replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>`
      );

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(result);
    } catch (error) {
      console.error("Server error:", error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
);

const getContentType = (filePath: string) => {
  const extname = path.extname(filePath);
  const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  return mimeTypes[extname] || "application/octet-stream";
};

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
