import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function resolveElectronExecutableRelativePath(platform: NodeJS.Platform) {
  switch (platform) {
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "win32":
      return "electron.exe";
    default:
      return "electron";
  }
}

function resolveElectronPackageRoot() {
  return path.dirname(require.resolve("electron/package.json"));
}

function resolveInstalledElectronExecutable(packageRoot: string) {
  const pathFile = path.join(packageRoot, "path.txt");

  if (!fs.existsSync(pathFile)) {
    return undefined;
  }

  const executableRelativePath = fs.readFileSync(pathFile, "utf8").trim();

  if (!executableRelativePath) {
    return undefined;
  }

  const executablePath = path.join(packageRoot, "dist", executableRelativePath);

  if (!fs.existsSync(executablePath)) {
    return undefined;
  }

  return executablePath;
}

export function ensureElectronExecutablePath() {
  const packageRoot = resolveElectronPackageRoot();
  const installedExecutable = resolveInstalledElectronExecutable(packageRoot);

  if (installedExecutable) {
    return installedExecutable;
  }

  const { version } = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
  ) as { version: string };
  const cacheZipPath = path.join(
    os.homedir(),
    "Library",
    "Caches",
    "electron",
    `electron-v${version}-${process.platform}-${process.arch}.zip`,
  );

  if (!fs.existsSync(cacheZipPath)) {
    throw new Error(`Electron cache archive not found: ${cacheZipPath}`);
  }

  const distRoot = path.join(packageRoot, "dist");
  fs.rmSync(distRoot, { recursive: true, force: true });
  fs.mkdirSync(distRoot, { recursive: true });

  const extracted = spawnSync("unzip", ["-q", cacheZipPath, "-d", distRoot], {
    stdio: "inherit",
  });

  if (extracted.status !== 0) {
    throw new Error(`Failed to extract Electron cache archive: ${cacheZipPath}`);
  }

  const executableRelativePath = resolveElectronExecutableRelativePath(process.platform);
  fs.writeFileSync(path.join(packageRoot, "path.txt"), executableRelativePath);

  const executablePath = path.join(distRoot, executableRelativePath);

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Electron executable missing after extraction: ${executablePath}`);
  }

  return executablePath;
}
