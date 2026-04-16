import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const outputRoot = path.join(repoRoot, "dist", "desktop", "openclaw-demo");

function resolveOpenclawRoot() {
  const configuredOpenclawRoot = process.env.OPENCLAW_DEMO_ROOT;

  if (!configuredOpenclawRoot) {
    return path.resolve(repoRoot, "..", "openclaw-demo");
  }

  if (path.isAbsolute(configuredOpenclawRoot)) {
    return configuredOpenclawRoot;
  }

  return path.resolve(repoRoot, configuredOpenclawRoot);
}

const openclawRoot = resolveOpenclawRoot();

const result = spawnSync("npm", ["run", "build"], {
  cwd: openclawRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });
await fs.cp(path.join(openclawRoot, "dist"), outputRoot, { recursive: true });
