import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL("./public/", import.meta.url)));
import { contentType } from "./server/static.mjs";
export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (url.pathname === "/api/session") {
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          name:
            req.headers["x-agc-user-name"] ||
            req.headers["x-user-name"] ||
            null,
          email: req.headers["x-agc-user-email"] || null,
          mode: "local",
        }),
      );
    }
    let name = decodeURIComponent(url.pathname);
    if (name === "/") name = "/index.html";
    const target = path.resolve(root, "." + name);
    if (!target.startsWith(root + path.sep) && target !== root) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    const data = await readFile(target);
    res.setHeader("Content-Type", contentType(target));
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
if (process.argv[1] === fileURLToPath(import.meta.url))
  server.listen(Number(process.env.PORT || 4319), "127.0.0.1", () =>
    console.log(
      "Atlas running at http://localhost:" + (process.env.PORT || 4319),
    ),
  );
