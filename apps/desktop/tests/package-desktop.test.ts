import { describe, expect, it } from "vitest";

import { createPackageSteps, resolvePackagePlatformOptions } from "../scripts/package-desktop";

describe("resolvePackagePlatformOptions", () => {
  it("为 macOS 选择两组独立的 dir 架构参数", () => {
    expect(resolvePackagePlatformOptions("darwin")).toEqual({
      builderFlag: "--mac",
      targets: [
        { key: "mac-x64", id: "package:mac:x64", args: ["dir", "--x64"] },
        { key: "mac-arm64", id: "package:mac:arm64", args: ["dir", "--arm64"] },
      ],
    });
  });

  it("为 Windows 选择 --win portable", () => {
    expect(resolvePackagePlatformOptions("win32")).toEqual({
      builderFlag: "--win",
      targets: [{ key: "win-portable", id: "package:win:portable", args: ["portable"] }],
    });
  });

  it("为 Linux 选择 --linux dir", () => {
    expect(resolvePackagePlatformOptions("linux")).toEqual({
      builderFlag: "--linux",
      targets: [{ key: "linux-dir", id: "package:linux:dir", args: ["dir"] }],
    });
  });
});

describe("createPackageSteps", () => {
  it("macOS 生成两条独立架构打包命令", () => {
    const steps = createPackageSteps({}, "darwin");

    expect(steps.map((step) => step.id)).toEqual(["build", "package:mac:x64", "package:mac:arm64"]);
    expect(steps[1]).toMatchObject({
      id: "package:mac:x64",
      title: "electron-builder --mac dir --x64",
      command: "pnpm",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--mac", "dir", "--x64"],
    });
    expect(steps[2]).toMatchObject({
      id: "package:mac:arm64",
      title: "electron-builder --mac dir --arm64",
      command: "pnpm",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--mac", "dir", "--arm64"],
    });
  });

  it("支持用环境变量将 macOS 打包限制为单一架构", () => {
    const steps = createPackageSteps({ CLAWEE_DESKTOP_PACKAGE_TARGET: "mac-arm64" }, "darwin");

    expect(steps.map((step) => step.id)).toEqual(["build", "package:mac:arm64"]);
    expect(steps[1]).toMatchObject({
      id: "package:mac:arm64",
      title: "electron-builder --mac dir --arm64",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--mac", "dir", "--arm64"],
    });
  });

  it("支持 Windows 平台打包命令", () => {
    const steps = createPackageSteps({}, "win32");

    expect(steps[1]).toMatchObject({
      title: "electron-builder --win portable",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--win", "portable"],
    });
  });

  it("支持 Linux 平台打包命令", () => {
    const steps = createPackageSteps({}, "linux");

    expect(steps[1]).toMatchObject({
      title: "electron-builder --linux dir",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--linux", "dir"],
    });
  });
});
