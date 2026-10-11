// A static file server for the built docs, the way GitHub Pages serves them: everything lives under the
// repository's name, a folder answers with its index.html, and an address nothing lives at gets 404.html.
// Run after the docs are built: `node apps/docs-e2e/server.mjs`.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "/react-cards-opening/";
const PORT = Number(process.env.DOCS_E2E_PORT ?? 4633);
const HOST = "127.0.0.1";
// The built docs. Another folder can stand in for them (a copy taken while someone else is rebuilding the site).
const root = path.resolve(
  process.env.DOCS_E2E_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../docs/dist/client"),
);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

/** The file a request path stands for, or null when it points outside the site. */
function fileFor(pathname) {
  if (!pathname.startsWith(BASE)) return null;
  const target = path.join(root, pathname.slice(BASE.length));
  // A path with ".." in it must not climb out of the built site.
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}

/** The file to send for a path: the file itself, or the index.html of a folder. Null when there is neither. */
async function resolve(target, isFolderAddress) {
  const found = await stat(target).catch(() => null);
  if (found?.isFile() && !isFolderAddress) return target;
  if (found?.isDirectory()) {
    const index = path.join(target, "index.html");
    const indexFound = await stat(index).catch(() => null);
    if (indexFound?.isFile()) return index;
  }
  return null;
}

function send(response, { status, file, head }) {
  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  if (head) {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    response.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  // The bare root is not part of the site: send the browser to where the site starts.
  if (pathname === "/" || pathname === BASE.slice(0, -1)) {
    response.writeHead(302, { location: BASE }).end();
    return;
  }

  const target = fileFor(pathname);
  const file = target ? await resolve(target, pathname.endsWith("/")) : null;
  if (file) {
    // A folder asked for without its slash goes to the address with one, so relative links keep working.
    if (file !== target && !pathname.endsWith("/")) {
      response.writeHead(301, { location: `${pathname}/${url.search}` }).end();
      return;
    }
    send(response, { status: 200, file, head });
    return;
  }

  const missing = path.join(root, "404.html");
  const hasPage = await stat(missing).catch(() => null);
  if (hasPage?.isFile()) {
    send(response, { status: 404, file: missing, head });
    return;
  }
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
});

server.listen(PORT, HOST, () => {
  console.warn(`docs-e2e: serving ${root} at http://${HOST}:${PORT}${BASE}`);
});
