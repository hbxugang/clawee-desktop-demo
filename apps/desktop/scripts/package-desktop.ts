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
type TargetSpec = {
  key: string;
  id: string;
  args: string[];
};

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
  targets: TargetSpec[];
} {
  switch (platform as SupportedPlatform) {
    case "darwin":
      return {
        builderFlag: "--mac",
        targets: [
          { key: "mac-x64", id: "package:mac:x64", args: ["dir", "--x64"] },
          { key: "mac-arm64", id: "package:mac:arm64", args: ["dir", "--arm64"] },
        ],
      };
    case "win32":
      return {
        builderFlag: "--win",
        targets: [{ key: "win-portable", id: "package:win:portable", args: ["portable"] }],
      };
    case "linux":
      return { builderFlag: "--linux", targets: [{ key: "linux-dir", id: "package:linux:dir", args: ["dir"] }] };
    default:
      throw new Error(`unsupported desktop packaging platform: ${platform}`);
  }
}

function resolvePackageTargets(
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  targets: TargetSpec[],
) {
  const requestedTarget = env.CLAWEE_DESKTOP_PACKAGE_TARGET;

  if (!requestedTarget) {
    return targets;
  }

  const matchedTarget = targets.find((target) => target.key === requestedTarget);

  if (!matchedTarget) {
    throw new Error(`unsupported ${platform} package target override: ${requestedTarget}`);
  }

  return [matchedTarget];
}

export function createPackageSteps(
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform = process.platform,
): Step[] {
  const { builderFlag, targets } = resolvePackagePlatformOptions(platform);
  const resolvedTargets = resolvePackageTargets(env, platform, targets);

  return [
    {
      id: "build",
      title: "build",
      command: "pnpm",
      args: ["run", "build"],
    },
    ...resolvedTargets.map((target) => ({
      id: target.id,
      title: `electron-builder ${builderFlag} ${target.args.join(" ")}`,
      command: "pnpm",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", builderFlag, ...target.args],
      env: {
        ...env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false",
      },
    })),
  ];
}

if (import.meta.main) {
  for (const step of createPackageSteps(process.env)) {
    run(step, desktopRoot);
  }
}
