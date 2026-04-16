# GitHub Actions 跨平台打包方案

## 目标

- 使用 `macos-latest`、`windows-latest`、`ubuntu-latest` 三个 runner 做桌面打包验证。
- 每个平台都串起 `openclaw-demo`、`gateway`、`web`、`desktop` 四段构建，保证 Electron 包内资源完整。
- 第一阶段只上传构建 artifact，不自动创建 release，也不接入签名。
- 文档先给出可执行方向和阻塞点，当前阶段不直接创建 `.github/workflows/*.yml`。

## 当前仓库现状

### 已经确认可用的部分

- `clawee-desktop-demo/package.json` 已提供 `pnpm desktop:package`，实际会进入 `apps/desktop/package` 脚本。
- `apps/desktop/scripts/package-desktop.ts` 当前会先跑 `pnpm run build`，再执行 `electron-builder --mac dir`。
- 本机已存在 `apps/desktop/out/mac/Clawee Desktop Demo.app`，说明当前 macOS 本地链路已经能产出 `.app` 目录包。
- `apps/desktop/scripts/build-openclaw-demo.ts` 会到仓库同级的 `openclaw-demo` 目录执行 `npm run build`，然后把 `dist` 复制到 `clawee-desktop-demo/dist/desktop/openclaw-demo`。
- `apps/desktop/scripts/build-gateway.sh` 现在依赖 `uv run --with pyinstaller==6.19.0 pyinstaller ...`，CI 必须同时具备 `uv`、Python 3.12 和 PyInstaller 运行环境。
- `apps/desktop/scripts/build-web.sh` 依赖 `apps/web/.next/standalone` 与 `apps/web/.next/static`，因此 CI 不能只做普通 Next 构建，必须保证 `build:desktop` 产出符合 standalone 布局。
- `apps/desktop/electron-builder.json` 已声明 `extraResources`，会把 `openclaw-demo`、`gateway`、`web` 三段产物打进 Electron 资源目录。

### 当前不能直接照搬到跨平台 CI 的部分

- `apps/desktop/scripts/build-desktop.ts` 仍然直接调用 `zsh scripts/build-gateway.sh` 和 `zsh scripts/build-web.sh`。
  这在 `windows-latest` 上不能直接执行，必须先改成跨平台 Node 脚本，或者在 workflow 内按平台分支处理。
- `apps/desktop/scripts/package-desktop.ts` 当前只写死了 `--mac dir`。
  如果要进入 matrix，需要让它根据 runner 平台切换到 `--mac`、`--win`、`--linux`，并同步调整 `electron-builder.json` target。
- `gateway` 的真实可分发产物现在依赖本地 `pyinstaller.spec` 与运行时目录结构。
  在把这段固化进 CI 之前，需要先分别在 macOS、Windows、Linux 本地验证产物是否都能被 Electron 正常拉起。
- `openclaw-demo` 是仓库中的独立子目录，但不在 `clawee-desktop-demo/pnpm-workspace.yaml` 里。
  这意味着 workflow 不能假设一次 `pnpm install` 能覆盖它，必须显式在 `openclaw-demo` 下执行 `npm ci`。

## 前置条件

- 仓库 checkout 后同时包含 `clawee-desktop-demo` 与同级目录 `openclaw-demo`。
- `clawee-desktop-demo/apps/desktop/electron-builder.json` 或打包脚本支持按平台切换 target，而不是只产出 macOS `dir`。
- `apps/web` 的 `build:desktop` 必须继续产出 Next standalone 结构。
- `apps/gateway` 的 PyInstaller 打包脚本需要在三平台都完成本地验证。
- 如需代码签名、证书或 notarization，后续再补仓库 secrets；本阶段不纳入 workflow 首版。

## 建议的 workflow matrix 草案

下面这份 YAML 只作为提案草图，用来说明 job 结构、依赖安装顺序和 artifact 上传位置。它还不能直接落库，原因见后文。

```yaml
name: package-desktop-demo

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.32.1

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: clawee-desktop-demo/pnpm-lock.yaml

      - uses: astral-sh/setup-uv@v6

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install web and desktop deps
        run: pnpm install --frozen-lockfile
        working-directory: clawee-desktop-demo

      - name: Install openclaw demo deps
        run: npm ci
        working-directory: openclaw-demo

      - name: Build package
        run: pnpm desktop:package
        working-directory: clawee-desktop-demo

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: desktop-${{ matrix.os }}
          path: clawee-desktop-demo/apps/desktop/out/**
```

## 落地时的必要修正

这部分是后续真正创建 workflow 时必须一起做的，不建议把上面的草图原样提交。

### 1. 先把桌面打包脚本改成平台可切换

- `apps/desktop/scripts/package-desktop.ts` 需要从当前平台推导 `electron-builder` 参数。
- 至少要支持：
  - macOS: `--mac`
  - Windows: `--win`
  - Linux: `--linux`
- `electron-builder.json` 也要从当前只声明 `mac.target = ["dir"]`，扩展为每个平台都有最小可工作的 target。
- 第一阶段建议 target 保守一些，以“能在 CI 里稳定产物”为优先，不先追求安装包格式全覆盖。

### 2. 把 `zsh` 构建脚本替换成跨平台 Node 脚本

- `build-gateway.sh` 和 `build-web.sh` 现在只能稳定跑在 Unix runner。
- 如果 workflow 要覆盖 `windows-latest`，应优先把这两段迁移成 Node/TypeScript 脚本，由 `build-desktop.ts` 统一调用。
- 原因不是只有 shell 可用性：
  - `cp -R`、here-doc、路径分隔符、可执行文件后缀这些点，Windows 上都需要显式处理。
  - 后续如果要根据平台拼 `pyinstaller` 或 Electron 输出目录，用 Node 更容易集中收口。

### 3. 先确认 Gateway 的跨平台打包产物

- 当前脚本说明 `gateway` 走的是 PyInstaller 单独打包，而不是单纯把 Python 源码塞进 Electron。
- 这段链路进入 CI 前，至少要确认三件事：
  - `pyinstaller.spec` 在三平台都能成功构建。
  - 产物目录能继续被 `electron-builder` 的 `extraResources` 正确收集。
  - Electron 主进程启动 `gateway` 的方式不依赖仅在 macOS 生效的路径假设。

### 4. 保持 `openclaw-demo` 的独立安装步骤

- 不要把 `openclaw-demo` 硬塞回 `pnpm workspace` 作为这次 workflow 的前置条件。
- 当前实现已经明确它是独立目录，并且由 `build-openclaw-demo.ts` 通过 `npm run build` 产出。
- workflow 只需要在 `openclaw-demo` 下执行 `npm ci`，然后继续沿用现有构建链路即可。

### 5. Artifact 范围建议保持在 `apps/desktop/out`

- 当前本地产物已经落在 `clawee-desktop-demo/apps/desktop/out`。
- 第一阶段上传整个 `out/**` 最直接，便于后续比对不同平台的目录结构。
- 真正发布前，再决定是否只上传安装包、是否排除 unpacked 目录、是否拆分按文件类型命名。

## 为什么当前阶段先写方案，不直接落 workflow

- 需要先把本地路径、锁文件、PyInstaller 产物和平台 target 跑通。
- Windows 下 `zsh` 脚本需要替换成跨平台 Node 脚本。
- Gateway 真实打包方式需要在本地验证后再固化进 CI。

## 建议的收口顺序

1. 先改 `apps/desktop/scripts/package-desktop.ts` 和 `electron-builder.json`，让打包目标随平台切换。
2. 再把 `build-gateway.sh`、`build-web.sh` 迁成跨平台脚本，并保持现有输出目录不变。
3. 分别在 macOS、Windows、Linux 本地验证 `pnpm desktop:package` 是否能完整串起 `openclaw-demo`、`gateway`、`web`、`desktop`。
4. 本地三平台验证通过后，再创建 `.github/workflows/package-desktop-demo.yml`，基本按上面的 matrix 草案落地。
5. artifact 稳定后，再单独补签名、release、tag 触发策略，不和首版打包验证混在一起。
