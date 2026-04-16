import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDesktopPaths } from "./paths";
import {
  resolveGatewayExecutablePath,
  resolveNodeRuntimeCommand,
  stopManagedProcesses,
  startProcess,
  startProcessSpec,
  type ManagedProcess,
  waitForPort,
  writeRuntimeConfig,
} from "./process-manager";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const managed: ManagedProcess[] = [];
let cleanedUp = false;

function trackProcess(name: string, child: ManagedProcess["child"]) {
  managed.push({ name, child });
  return child;
}

function cleanupProcesses() {
  if (cleanedUp) {
    return;
  }

  cleanedUp = true;
  stopManagedProcesses(managed);
}

async function startGatewayProcess(
  gatewayDistRoot: string,
  runtimeConfigPath: string,
  gatewayPort: number,
) {
  const binaryPath = resolveGatewayExecutablePath(gatewayDistRoot);

  await fs.access(binaryPath);

  return startProcess(binaryPath, [], gatewayDistRoot, {
    ...process.env,
    CLAWEE_RUNTIME_CONFIG_PATH: runtimeConfigPath,
    CLAWEE_GATEWAY_PORT: String(gatewayPort),
  });
}

async function bootstrap() {
  const paths = resolveDesktopPaths({
    appRoot,
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    env: {
      ...process.env,
      CLAWEE_RUNTIME_ROOT: app.isPackaged ? path.join(app.getPath("userData"), "runtime") : "",
    },
  });

  const openclawPort = Number(process.env.OPENCLAW_DEMO_PORT || "43120");
  const gatewayPort = Number(process.env.CLAWEE_GATEWAY_PORT || "43121");
  const webPort = Number(process.env.PORT || "43122");
  const openclawBaseUrl = `http://127.0.0.1:${openclawPort}`;

  trackProcess(
    "openclaw-demo",
    startProcessSpec(
      resolveNodeRuntimeCommand({
        execPath: process.execPath,
        scriptPath: path.join(paths.openclawDistRoot, "server.js"),
        env: {
          ...process.env,
          OPENCLAW_DEMO_PORT: String(openclawPort),
        },
      }),
      paths.openclawDistRoot,
    ),
  );
  await waitForPort("127.0.0.1", openclawPort, 30000);
  await writeRuntimeConfig(paths.runtimeConfigPath, openclawBaseUrl);

  trackProcess(
    "gateway",
    await startGatewayProcess(paths.gatewayDistRoot, paths.runtimeConfigPath, gatewayPort),
  );
  await waitForPort("127.0.0.1", gatewayPort, 30000);

  trackProcess(
    "web",
    startProcessSpec(
      resolveNodeRuntimeCommand({
        execPath: process.execPath,
        scriptPath: path.join(paths.webDistRoot, "server.cjs"),
        env: {
          ...process.env,
          PORT: String(webPort),
          HOSTNAME: "127.0.0.1",
          NEXT_PUBLIC_GATEWAY_BASE_URL: `http://127.0.0.1:${gatewayPort}`,
        },
      }),
      paths.webDistRoot,
    ),
  );
  await waitForPort("127.0.0.1", webPort, 30000);

  const win = new BrowserWindow({ width: 1280, height: 900, show: false });
  await win.loadURL(`http://127.0.0.1:${webPort}`);
  win.show();
}

app.on("before-quit", cleanupProcesses);
app.on("window-all-closed", () => {
  app.quit();
});

app.whenReady().then(() => {
  bootstrap().catch((error: unknown) => {
    console.error("desktop bootstrap failed", error);
    cleanupProcesses();
    app.quit();
  });
});
