import { describe, expect, it } from "vitest";

import { createPackageSteps, resolvePackagePlatformOptions } from "../scripts/package-desktop";

describe("resolvePackagePlatformOptions", () => {
  it("为 macOS 选择 --mac dir", () => {
    expect(resolvePackagePlatformOptions("darwin")).toEqual({
      builderFlag: "--mac",
      target: "dir",
    });
  });

  it("为 Windows 选择 --win dir", () => {
    expect(resolvePackagePlatformOptions("win32")).toEqual({
      builderFlag: "--win",
      target: "dir",
    });
  });

  it("为 Linux 选择 --linux dir", () => {
    expect(resolvePackagePlatformOptions("linux")).toEqual({
      builderFlag: "--linux",
      target: "dir",
    });
  });
});

describe("createPackageSteps", () => {
  it("默认按当前平台生成打包命令", () => {
    const steps = createPackageSteps({}, "darwin");

    expect(steps.map((step) => step.id)).toEqual(["build", "package"]);
    expect(steps[1]).toMatchObject({
      id: "package",
      title: "electron-builder --mac dir",
      command: "pnpm",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--mac", "dir"],
    });
  });

  it("支持 Windows 平台打包命令", () => {
    const steps = createPackageSteps({}, "win32");

    expect(steps[1]).toMatchObject({
      title: "electron-builder --win dir",
      args: ["exec", "electron-builder", "--config", "electron-builder.json", "--win", "dir"],
    });
  });
});
