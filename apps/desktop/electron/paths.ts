import path from "node:path";

type ResolveDesktopPathsInput = {
  appRoot: string;
  isPackaged: boolean;
  resourcesPath?: string;
  env: NodeJS.ProcessEnv;
};

export function resolveDesktopPaths(input: ResolveDesktopPathsInput) {
  const repoRoot = path.resolve(input.appRoot, "..", "..");
  const desktopDistRoot = path.join(repoRoot, "dist", "desktop");
  const resourceRoot =
    input.isPackaged && input.resourcesPath ? input.resourcesPath : desktopDistRoot;
  const runtimeRoot =
    input.isPackaged && input.env.CLAWEE_RUNTIME_ROOT
      ? input.env.CLAWEE_RUNTIME_ROOT
      : path.join(desktopDistRoot, "runtime");

  return {
    repoRoot,
    desktopDistRoot,
    openclawDistRoot: path.join(resourceRoot, "openclaw-demo"),
    gatewayDistRoot: path.join(resourceRoot, "gateway"),
    webDistRoot: path.join(resourceRoot, "web"),
    runtimeConfigPath: path.join(runtimeRoot, "service-config.json"),
  };
}
