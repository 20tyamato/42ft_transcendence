import { createServer, IncomingMessage, ServerResponse } from "http";
import { readHTMLfile } from "./src/utils/file";
import { routes } from "./route";
import NotFoundPage from "./src/pages/404";

const PORT: number = 3000;

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const indexHTML = await readHTMLfile("../public/index.html");
    const url = req.url ?? "";

    const page = routes[url] ? routes[url] : NotFoundPage;
    const html = await page.render();

    const result = indexHTML.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(result);
  }
);

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
