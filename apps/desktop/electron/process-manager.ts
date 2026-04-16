import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";

export type ManagedProcess = {
  name: string;
  child: ChildProcess;
};

export type ProcessSpec = {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
};

export function startProcess(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
) {
  return spawn(command, args, { cwd, env, stdio: "inherit" });
}

export function startProcessSpec(spec: ProcessSpec, cwd: string) {
  return startProcess(spec.command, spec.args, cwd, spec.env);
}

export function resolveNodeRuntimeCommand(input: {
  execPath: string;
  scriptPath: string;
  env: NodeJS.ProcessEnv;
}): ProcessSpec {
  return {
    command: input.execPath,
    args: [input.scriptPath],
    env: {
      ...input.env,
      ELECTRON_RUN_AS_NODE: "1",
    },
  };
}

export function resolveGatewayExecutablePath(
  gatewayDistRoot: string,
  platform: NodeJS.Platform = process.platform,
) {
  const executableName =
    platform === "win32" ? "clawee-desktop-demo-gateway.exe" : "clawee-desktop-demo-gateway";

  return path.join(gatewayDistRoot, executableName);
}

export function stopManagedProcesses(processes: ManagedProcess[]) {
  for (const managed of [...processes].reverse()) {
    if (!managed.child.killed) {
      managed.child.kill("SIGTERM");
    }
  }
}

export async function writeRuntimeConfig(filePath: string, openclawBaseUrl: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ openclawBaseUrl }, null, 2));
}

export async function waitForPort(host: string, port: number, timeoutMs: number) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const open = await new Promise<boolean>((resolve) => {
      const socket = net.connect({ host, port });
      let settled = false;

      const finish = (result: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(1000);
      socket.on("connect", () => finish(true));
      socket.on("timeout", () => finish(false));
      socket.on("error", () => finish(false));
    });

    if (open) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`port ${host}:${port} not ready`);
}
