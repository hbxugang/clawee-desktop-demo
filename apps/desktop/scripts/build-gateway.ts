import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const gatewayRoot = path.join(repoRoot, "apps", "gateway");
const outputRoot = path.join(repoRoot, "dist", "desktop", "gateway");
const buildRoot = path.join(repoRoot, "dist", "desktop", ".gateway-build");

async function main() {
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.rm(buildRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });

  const result = spawnSync(
    "uv",
    [
      "run",
      "--project",
      gatewayRoot,
      "--with",
      "pyinstaller==6.19.0",
      "pyinstaller",
      "pyinstaller.spec",
      "--distpath",
      outputRoot,
      "--workpath",
      buildRoot,
      "--noconfirm",
      "--clean",
    ],
    {
      cwd: gatewayRoot,
      stdio: "inherit",
    },
  );

  await fs.rm(path.join(gatewayRoot, "uv.lock"), { force: true });
  await fs.rm(buildRoot, { recursive: true, force: true });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await main();
