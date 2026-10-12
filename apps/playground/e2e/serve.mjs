// For the review scripts, not the tests: builds the playground's page for production and serves it on a port of
// its own, so a script needs nothing running and never measures or pictures the development build.
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const playground = path.join(here, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };

/** Answers where the page is served, every effect the library has, and a way to stop serving. */
export async function servePlayground() {
  // The one page the scripts play on. The playground's usual build has two, and that is two stylesheets to keep apart.
  const root = mkdtempSync(path.join(tmpdir(), "rco-playground-"));
  await build({
    root: playground,
    configFile: path.join(playground, "vite.config.ts"),
    logLevel: "error",
    build: { outDir: root, emptyOutDir: true, rollupOptions: { input: path.join(playground, "index.html") } },
  });
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname);
    const file = path.join(root, pathname === "/" ? "index.html" : pathname);
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  // The list comes from the built package: build it first if an effect was added (pnpm build).
  const { EFFECT_LIST } = await import(path.join(here, "../../../packages/effects/dist/index.js"));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    effects: EFFECT_LIST.map((effect) => ({ name: effect.name, kind: effect.kind, seconds: effect.seconds })),
    close: () => {
      server.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
