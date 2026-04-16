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

const packaged = spawnSync(
  "pnpm",
  ["exec", "electron-builder", "--config", "electron-builder.json", "--mac", "dir"],
  {
    cwd: desktopRoot,
    stdio: "inherit",
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" },
  },
);

process.exit(packaged.status ?? 0);
