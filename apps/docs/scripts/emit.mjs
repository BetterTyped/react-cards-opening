// Writes the files a static site needs beside its pages (sitemap, llms.txt, Markdown twins, 404.html) into the
// built site. Run after `vite build`. Vite loads the TypeScript, so the registry is read as it is, not copied.
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist/client");

const server = await createServer({
  root,
  configFile: false,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true },
});
try {
  const { staticFiles } = await server.ssrLoadModule("/src/static/files.ts");
  const files = staticFiles();
  for (const file of files) {
    const target = path.join(out, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.body);
  }
  // GitHub Pages serves 404.html from the root for any address nothing lives at.
  await copyFile(path.join(out, "404/index.html"), path.join(out, "404.html"));
  // oxlint-disable-next-line no-console -- a build step says what it wrote
  console.log(`emit: ${files.length} files and 404.html written to ${path.relative(root, out)}`);
} finally {
  await server.close();
}
