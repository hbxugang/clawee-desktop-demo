import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Step = {
  id: string;
  title: string;
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
};

type SupportedPlatform = "darwin" | "win32" | "linux";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(step: Step, cwd: string) {
  const result = spawnSync(step.command, step.args, {
    cwd,
    env: step.env ? { ...process.env, ...step.env } : process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export function resolvePackagePlatformOptions(platform: NodeJS.Platform): {
  builderFlag: "--mac" | "--win" | "--linux";
  target: "dir";
} {
  switch (platform as SupportedPlatform) {
    case "darwin":
      return { builderFlag: "--mac", target: "dir" };
    case "win32":
      return { builderFlag: "--win", target: "dir" };
    case "linux":
      return { builderFlag: "--linux", target: "dir" };
    default:
      throw new Error(`unsupported desktop packaging platform: ${platform}`);
  }
}

export function createPackageSteps(
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform = process.platform,
): Step[] {
  const { builderFlag, target } = resolvePackagePlatformOptions(platform);

  return [
    {
      id: "build",
      title: "build",
      command: "pnpm",
      args: ["run", "build"],
    },
    {
      id: "package",
      title: `electron-builder ${builderFlag} ${target}`,
      command: "pnpm",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", builderFlag, target],
      env: {
        ...env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false",
      },
    },
  ];
}

if (import.meta.main) {
  for (const step of createPackageSteps(process.env)) {
    run(step, desktopRoot);
  }
}
