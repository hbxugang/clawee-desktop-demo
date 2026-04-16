import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const webRoot = path.join(repoRoot, "apps", "web");
const outputRoot = path.join(repoRoot, "dist", "desktop", "web");
const standaloneRoot = path.join(webRoot, ".next", "standalone");
const staticRoot = path.join(webRoot, ".next", "static");

function runBuild() {
  const result = spawnSync("pnpm", ["--dir", webRoot, "build:desktop"], {
    cwd: desktopRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  runBuild();

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(path.join(outputRoot, "apps", "web", ".next"), { recursive: true });
  await fs.cp(standaloneRoot, outputRoot, { recursive: true });
  await fs.cp(staticRoot, path.join(outputRoot, "apps", "web", ".next", "static"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(outputRoot, "server.cjs"),
    `const path = require("node:path");

process.chdir(__dirname);
require(path.join(__dirname, "apps", "web", "server.js"));
`,
  );
}

await main();
