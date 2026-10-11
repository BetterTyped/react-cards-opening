// The packages this repository publishes, for the workflows. A package is published when it lives in `packages/`
// and its package.json does not say `"private": true`. Every one of them carries the same version number.
//
//   node .github/scripts/packages.mjs list                  one line per package: directory, name, version (tabs)
//   node .github/scripts/packages.mjs check                 fails unless they all agree; prints the shared version
//   node .github/scripts/packages.mjs set-version 1.2.3     writes that version into every one of them
//
// Run from the repository root. No dependencies, so it works before `pnpm install`.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const DEPENDENCY_FIELDS = ["dependencies", "peerDependencies", "optionalDependencies"];

function readPackages() {
  const base = path.join(root, "packages");
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.posix.join("packages", entry.name))
    .filter((dir) => existsSync(path.join(root, dir, "package.json")))
    .map((dir) => {
      const file = path.join(root, dir, "package.json");
      return { dir, file, manifest: JSON.parse(readFileSync(file, "utf8")) };
    })
    .toSorted((a, b) => a.dir.localeCompare(b.dir));
}

/** The workspace packages a package needs at install time, by name. */
function workspaceNeeds(manifest) {
  return DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(([, range]) => String(range).startsWith("workspace:"))
      .map(([name]) => name),
  );
}

/** Dependencies first, so nobody can install a package a moment before the one it needs is up. */
function inPublishOrder(packages) {
  const byName = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]));
  const ordered = [];
  const seen = new Set();
  const visit = (pkg) => {
    if (seen.has(pkg.manifest.name)) return;
    seen.add(pkg.manifest.name);
    for (const name of workspaceNeeds(pkg.manifest)) {
      const needed = byName.get(name);
      if (needed) visit(needed);
    }
    ordered.push(pkg);
  };
  for (const pkg of packages) visit(pkg);
  return ordered;
}

/** Results go to stdout, where the workflows read them. Everything said to a person goes to stderr. */
const print = (line) => process.stdout.write(`${line}\n`);

function fail(message) {
  // The first line shows up as an annotation on the run; the rest is for the log.
  console.error(`::error::${message.split("\n")[0]}`);
  console.error(message);
  process.exit(1);
}

const all = readPackages();
const publishable = inPublishOrder(all.filter((pkg) => pkg.manifest.private !== true));
const [command, argument] = process.argv.slice(2);

if (command === "list") {
  for (const pkg of publishable) print([pkg.dir, pkg.manifest.name, pkg.manifest.version].join("\t"));
} else if (command === "check") {
  const privateNames = new Set(all.filter((pkg) => pkg.manifest.private === true).map((pkg) => pkg.manifest.name));
  // A published package that needs a private one installs for nobody.
  for (const pkg of publishable) {
    const missing = workspaceNeeds(pkg.manifest).filter((name) => privateNames.has(name));
    if (missing.length > 0) {
      fail(`${pkg.manifest.name} is published but depends on private workspace packages: ${missing.join(", ")}`);
    }
  }
  const versions = new Set(publishable.map((pkg) => pkg.manifest.version));
  if (versions.size > 1) {
    const table = publishable.map((pkg) => `  ${pkg.manifest.version}\t${pkg.manifest.name}`).join("\n");
    fail(`The published packages must share one version, found ${versions.size}:\n${table}`);
  }
  if (publishable.length === 0) {
    console.error("No published packages yet: every package.json in packages/ is private.");
  } else {
    console.error(`${publishable.length} published packages, all at ${[...versions][0]}.`);
    print([...versions][0]);
  }
} else if (command === "set-version") {
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(argument ?? "")) fail(`Not a version: "${argument ?? ""}"`);
  for (const pkg of publishable) {
    writeFileSync(pkg.file, `${JSON.stringify({ ...pkg.manifest, version: argument }, null, 2)}\n`);
    console.error(`${pkg.manifest.name} -> ${argument}`);
  }
} else {
  fail(`Unknown command "${command ?? ""}". Use list, check or set-version <version>.`);
}
