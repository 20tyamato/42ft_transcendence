import { createServer, IncomingMessage, ServerResponse } from "http";
import HomePage from "./src/pages/Home";
import { readHTMLfile } from "./src/utils/file";

const PORT: number = 3000;

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/html" });

    const indexHTML = await readHTMLfile("../public/index.html");
    const html = await HomePage.render();
    console.log("html", html);
    const result = indexHTML.replace(
      '<div id="root"></div>',
      "<div id='root'>" + html + "</div>"
    );
    console.log("indexHTML", indexHTML);
    console.log("result", result);
    res.end(indexHTML);
  }
);

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
