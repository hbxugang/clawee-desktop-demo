import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

import * as processManager from "../electron/process-manager";

describe("desktop self-contained runtime", () => {
  it("uses the Electron runtime to launch bundled Node services", () => {
    expect(typeof (processManager as Record<string, unknown>).resolveNodeRuntimeCommand).toBe(
      "function",
    );

    const spec = (
      processManager as {
        resolveNodeRuntimeCommand: (input: {
          execPath: string;
          scriptPath: string;
          env: NodeJS.ProcessEnv;
        }) => { command: string; args: string[]; env: NodeJS.ProcessEnv };
      }
    ).resolveNodeRuntimeCommand({
      execPath: "/Applications/Clawee Desktop Demo.app/Contents/MacOS/Clawee Desktop Demo",
      scriptPath: "/bundle/openclaw-demo/server.js",
      env: { OPENCLAW_DEMO_PORT: "43120" },
    });

    expect(spec.command).toBe(
      "/Applications/Clawee Desktop Demo.app/Contents/MacOS/Clawee Desktop Demo",
    );
    expect(spec.args).toEqual(["/bundle/openclaw-demo/server.js"]);
    expect(spec.env.ELECTRON_RUN_AS_NODE).toBe("1");
  });

  it("expects a packaged gateway executable path instead of a uv fallback", () => {
    expect(typeof (processManager as Record<string, unknown>).resolveGatewayExecutablePath).toBe(
      "function",
    );

    const gatewayPath = (
      processManager as {
        resolveGatewayExecutablePath: (gatewayDistRoot: string) => string;
      }
    ).resolveGatewayExecutablePath("/bundle/gateway");

    expect(gatewayPath).toContain("/bundle/gateway/clawee-desktop-demo-gateway");
    expect(gatewayPath).not.toContain("uv");
  });

  it("wires main.ts to bundled runtimes instead of system node or uv", async () => {
    const mainSource = await fs.readFile(new URL("../electron/main.ts", import.meta.url), "utf8");

    expect(mainSource).toContain('resolveNodeRuntimeCommand({');
    expect(mainSource).toContain('scriptPath: path.join(paths.openclawDistRoot, "server.js")');
    expect(mainSource).toContain('scriptPath: path.join(paths.webDistRoot, "server.cjs")');
    expect(mainSource).toContain("resolveGatewayExecutablePath(gatewayDistRoot)");
    expect(mainSource).not.toContain('startProcess("node"');
    expect(mainSource).not.toContain('"uv"');
    expect(mainSource).not.toContain('"--with-requirements"');
  });

  it("builds the gateway as a version-pinned executable artifact", async () => {
    const script = await fs.readFile(new URL("../scripts/build-gateway.sh", import.meta.url), "utf8");

    expect(script).toContain("--with pyinstaller==6.19.0");
    expect(script).not.toContain("requirements.txt");
    expect(script).not.toContain('cp -R "$ROOT_DIR/apps/gateway/app"');
  });

  it("wires dev.ts through an Electron runtime guard instead of pnpm exec electron", async () => {
    const devSource = await fs.readFile(new URL("../scripts/dev.ts", import.meta.url), "utf8");

    expect(devSource).toContain("ensureElectronExecutablePath");
    expect(devSource).not.toContain('"pnpm", ["exec", "electron"');
  });

  it("copies the full Next standalone root so packaged web dependencies stay self-contained", async () => {
    const script = await fs.readFile(new URL("../scripts/build-web.sh", import.meta.url), "utf8");

    expect(script).toContain('STANDALONE_DIR="$ROOT_DIR/apps/web/.next/standalone"');
    expect(script).toContain('mkdir -p "$OUT_DIR/apps/web/.next"');
    expect(script).toContain('cp -R "$STANDALONE_DIR"/. "$OUT_DIR"/');
    expect(script).toContain('cp -R "$ROOT_DIR/apps/web/.next/static" "$OUT_DIR/apps/web/.next/static"');
    expect(script).toContain('require(path.join(__dirname, "apps", "web", "server.js"));');
    expect(script).not.toContain('STANDALONE_DIR="$ROOT_DIR/apps/web/.next/standalone/apps/web"');
    expect(script).not.toContain('require(path.join(__dirname, "server.js"));');
  });

  it("bundles gateway binaries and data into the PyInstaller executable", async () => {
    const specSource = await fs.readFile(new URL("../../gateway/pyinstaller.spec", import.meta.url), "utf8");

    expect(specSource).toContain("a.binaries");
    expect(specSource).toContain("a.datas");
  });

  it("packages a gateway runner entrypoint instead of bare FastAPI app module", async () => {
    const specSource = await fs.readFile(new URL("../../gateway/pyinstaller.spec", import.meta.url), "utf8");

    expect(specSource).toContain('Analysis(["app/desktop_entry.py"]');
    expect(specSource).not.toContain('Analysis(["app/main.py"]');
  });

  it("runs uvicorn with a directly imported gateway app object", async () => {
    const entrySource = await fs.readFile(new URL("../../gateway/app/desktop_entry.py", import.meta.url), "utf8");

    expect(entrySource).toContain("from app.main import app");
    expect(entrySource).toContain("uvicorn.run(");
    expect(entrySource).toContain("app,");
    expect(entrySource).not.toContain('"app.main:app"');
  });
});
