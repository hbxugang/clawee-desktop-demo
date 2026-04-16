import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const [command, args] of [
  ["pnpm", ["exec", "tsx", "scripts/build-openclaw-demo.ts"]],
  ["pnpm", ["run", "build:gateway"]],
  ["pnpm", ["run", "build:web"]],
  ["pnpm", ["run", "build:electron"]],
] as const) {
  const result = spawnSync(command, args, {
    cwd: desktopRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
