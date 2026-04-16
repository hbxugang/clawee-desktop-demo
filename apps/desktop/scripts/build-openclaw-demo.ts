import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const openclawRoot = path.resolve(repoRoot, "..", "openclaw-demo");
const outputRoot = path.join(repoRoot, "dist", "desktop", "openclaw-demo");

const result = spawnSync("npm", ["run", "build"], {
  cwd: openclawRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });
await fs.cp(path.join(openclawRoot, "dist"), outputRoot, { recursive: true });
