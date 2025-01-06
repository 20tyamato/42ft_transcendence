import { createServer, IncomingMessage, ServerResponse } from "http";
import HomePage from "./src/pages/Home";

const PORT: number = 3000;

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    const html = await HomePage.render();
    res.end(html);
  }
);

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
