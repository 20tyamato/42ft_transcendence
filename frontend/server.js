import { createServer } from "http";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getFilePath = (url) => {
  if (url === "/") return join(__dirname, "index.html");
  if (url.endsWith(".js")) return join(__dirname, "dist", url);

  return join(__dirname, url);
};

const getContentType = (filePath) => {
  const extname = path.extname(filePath);
  const mimeTypes = {
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

const server = createServer(async (req, res) => {
  try {
    const filePath = getFilePath(req.url);
    const contentType = getContentType(filePath);

    const content = await readFile(filePath, "utf-8");
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`server is running on: http://localhost:${PORT}`);
});
