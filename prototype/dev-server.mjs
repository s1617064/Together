import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = normalize(__dirname);
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const relativePath =
    url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(rootDir, relativePath));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const safePath = existsSync(filePath) && statSync(filePath).isFile()
    ? filePath
    : join(rootDir, "index.html");

  const ext = extname(safePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });

  createReadStream(safePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Together prototype running at http://${host}:${port}`);
});
