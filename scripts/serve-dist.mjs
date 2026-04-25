import { createServer } from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".wasm", "application/wasm"],
]);

const resolveFile = (requestPath) => {
  const cleanedPath = decodeURIComponent(requestPath.split("?")[0] || "/");
  const safePath = cleanedPath === "/" ? "/index.html" : cleanedPath;
  const resolvedPath = path.resolve(rootDir, `.${safePath}`);

  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }

  return resolvedPath;
};

const server = createServer(async (req, res) => {
  const urlPath = req.url || "/";
  let filePath = resolveFile(urlPath);

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes.get(ext) || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    const fallback = path.join(rootDir, "index.html");
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    createReadStream(fallback).pipe(res);
  }
});

server.listen(port, host, () => {
  console.log(`Serving ${rootDir} at http://${host}:${port}`);
});
