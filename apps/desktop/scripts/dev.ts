import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const built = spawnSync("pnpm", ["run", "build"], {
  cwd: desktopRoot,
  stdio: "inherit",
});

if (built.status !== 0) {
  process.exit(built.status ?? 1);
}

const launched = spawnSync("pnpm", ["exec", "electron", "dist/electron/main.js"], {
  cwd: desktopRoot,
  stdio: "inherit",
});

process.exit(launched.status ?? 0);
