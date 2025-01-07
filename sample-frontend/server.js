import { createServer } from "http";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = createServer(async (req, res) => {
  try {
    let filePath;
    let contentType;

    if (req.url === "/") {
      filePath = join(__dirname, "index.html");
      contentType = "text/html";
    } else if (req.url.endsWith(".js")) {
      filePath = join(__dirname, "dist", req.url);
      contentType = "application/javascript";
    } else if (req.url.endsWith(".css")) {
      filePath = join(__dirname, req.url);
      contentType = "text/css";
    } else {
      filePath = join(__dirname, "index.html");
      contentType = "text/html";
    }

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
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
