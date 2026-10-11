// Packs every published package and checks the tarball the way a registry and a type checker would: publint for
// the manifest, "are the types wrong" for what TypeScript resolves. Run after `pnpm build`.
//   node .github/scripts/check-packages.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: "inherit" });
const list = execFileSync("node", [".github/scripts/packages.mjs", "list"], { cwd: root, encoding: "utf8" });
const out = mkdtempSync(path.join(tmpdir(), "rco-pack-"));

try {
  for (const line of list.trim().split("\n")) {
    const [dir, name] = line.split("\t");
    console.log(`\n== ${name}`);
    run("pnpm", ["exec", "publint", "--strict"], path.join(root, dir));
    run("pnpm", ["pack", "--pack-destination", out], path.join(root, dir));
  }
  for (const tarball of readdirSync(out)) {
    console.log(`\n== types of ${tarball}`);
    // The packages are ES modules only, and a stylesheet is not something TypeScript resolves.
    run("pnpm", [
      "exec",
      "attw",
      path.join(out, tarball),
      "--profile",
      "esm-only",
      "--exclude-entrypoints",
      "styles.css",
    ]);
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
