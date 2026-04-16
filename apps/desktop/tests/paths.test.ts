import { describe, expect, it } from "vitest";

import { resolveDesktopPaths } from "../electron/paths";

describe("resolveDesktopPaths", () => {
  it("returns dist roots for unpackaged mode", () => {
    const paths = resolveDesktopPaths({
      appRoot: "/repo/clawee-desktop-demo/apps/desktop",
      isPackaged: false,
      resourcesPath: undefined,
      env: {},
    });

    expect(paths.desktopDistRoot).toContain("/repo/clawee-desktop-demo/dist/desktop");
    expect(paths.runtimeConfigPath).toContain(
      "/repo/clawee-desktop-demo/dist/desktop/runtime/service-config.json",
    );
  });
});
