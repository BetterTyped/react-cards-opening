import react from "@vitejs/plugin-react";
import * as path from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

/**
 * Type declarations as Node reads them. The sources import each other without extensions ("./opening"), which a
 * bundler resolves and Node's own ESM rules do not: a project on `moduleResolution: "node16"` would find the
 * package's entry and then nothing behind it. So every relative import in an emitted declaration gets the file it
 * really means: "./opening.js".
 */
function withExtensions(content: string): string {
  return content.replaceAll(/(\bfrom\s+|\bimport\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g, (...match: string[]) => {
    const [whole, lead, quote, spec] = match;
    if (/\.(js|mjs|cjs|json|css)$/.test(spec)) return whole;
    return `${lead}${quote}${spec}.js${quote}`;
  });
}

/**
 * How both packages are built and tested: one ES module with its types, one stylesheet where there is one, and
 * nothing bundled that the package did not write.
 */
export function libConfig({
  dir,
}: {
  /** The package's own directory: `__dirname` of its vite.config.ts. */ dir: string;
}) {
  return defineConfig({
    root: dir,
    cacheDir: path.join(dir, "../../node_modules/.vite/packages", path.basename(dir)),
    plugins: [
      react(),
      dts({
        entryRoot: "src",
        tsconfigPath: path.join(dir, "tsconfig.lib.json"),
        beforeWriteFile: (filePath, content) => ({ filePath, content: withExtensions(content) }),
      }),
    ],
    build: {
      outDir: "./dist",
      emptyOutDir: true,
      lib: { entry: "src/index.ts", fileName: "index", formats: ["es" as const], cssFileName: "styles" },
      rolldownOptions: {
        // A library bundles nothing it did not write: every package it imports stays an import, so there is one
        // React and one GSAP on the page and the consumer's bundler decides what ships.
        external: (id) => !id.startsWith(".") && !path.isAbsolute(id),
      },
    },
    test: {
      watch: false,
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: [path.join(dir, "testing/setup.ts")],
      reporters: ["default"],
    },
  });
}
