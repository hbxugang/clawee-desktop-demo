# 桌面打包与 Tag Release 发布完成说明

## 文档目的

本文档用于记录 `clawee-desktop-demo` 当前已经落地的桌面打包与 GitHub Tag Release 发布能力，重点说明：

- 如何触发桌面应用打包
- 如何通过 `tag` 触发正式发布
- `tag` 发布后，GitHub Release 页面会直接出现可下载的应用压缩包

下文中的“打 Tag”即创建并推送类似 `v0.0.1`、`v0.1.0` 这样的 Git 标签。

---

## 当前已完成能力

目前仓库已经具备以下能力：

- 支持 `macOS x64`、`macOS arm64`、`Windows portable`、`Linux` 四类桌面发布资产
- 桌面打包流程已经接入 GitHub Actions
- GitHub Actions 会额外拉取 `openclaw-demo` 仓库作为打包依赖
- 打包流程会产出四个发布资产对应的 zip 压缩包
- 当推送 `v*` 格式的 Tag 时，会自动创建或更新对应的 GitHub Release
- Release 页面会自动挂载四个可下载应用压缩包

当前 workflow 文件为：

- [package-desktop-demo.yml](/Users/xugang/codespace/krillinai/clawee-desktop-demo/.github/workflows/package-desktop-demo.yml)

---

## 已落地的打包与发布链路

### 1. 普通构建触发

以下情况会触发打包 workflow：

- 手动触发 `workflow_dispatch`
- 推送到 `main`
- 推送符合 `v*` 规则的 Tag

其中：

- `main` 与手动触发，主要用于验证打包链是否正常
- `v*` Tag，除了构建，还会进入 Release 发布流程

### 2. 四资产构建

workflow 当前会在以下 runner 上并行打包：

- `macos-13`
- `macos-14`
- `windows-latest`
- `ubuntu-latest`

每个平台都会完成以下步骤：

- checkout 当前仓库
- checkout `hbxugang/openclaw-demo`
- 安装 `pnpm`、`Node.js`、`uv`、`Python`
- 执行 workspace 依赖安装
- 在 `openclaw-demo` 目录执行 `npm ci`
- 执行 `pnpm desktop:package`
- 将 `apps/desktop/out` 打成平台对应 zip

### 3. Release 资产产物

当前发布到 Release 的压缩包命名如下：

- `clawee-desktop-demo-macos-x64.zip`
- `clawee-desktop-demo-macos-arm64.zip`
- `clawee-desktop-demo-windows-portable.zip`
- `clawee-desktop-demo-linux.zip`

这些 zip 是从 `apps/desktop/out` 目录打包出来的，适合直接挂在 GitHub Release 页面供下载。

---

## 打 Tag 后会发生什么

这是当前最重要的发布行为。

当仓库推送一个符合 `v*` 规则的 Tag，例如：

- `v0.0.1`
- `v0.1.0`
- `v1.0.0`

GitHub Actions 会自动执行以下流程：

1. 四条构建矩阵分别执行桌面打包
2. 每条矩阵生成一个 zip 压缩包
3. 等四条矩阵全部成功后，进入 `release` job
4. `release` job 检查该 Tag 对应的 GitHub Release 是否存在
5. 若不存在，则自动创建 Release
6. 若已存在，则复用该 Release
7. 将四个 zip 作为 Release assets 上传
8. 若资产已存在，则覆盖更新

这意味着：

- 打完 Tag 后，不需要再手工上传桌面应用
- Release 页面会直接出现可下载的应用压缩包
- 使用者可以直接从 GitHub Release 页面下载对应平台应用

---

## 实际发布方式

### 推荐发布命令

先推送主分支更新：

```bash
git push
```

然后创建并推送 Tag：

```bash
git tag v0.0.1
git push origin v0.0.1
```

### 测试发布链路的更安全方式

如果只是想验证打包链路，优先建议使用以下方式，而不是额外推送测试 Tag：

- 直接在 GitHub Actions 页面手动触发 `workflow_dispatch`
- 或先推送到 `main`，只验证构建与 artifact

原因是：

- 当前 workflow 对所有 `v*` Tag 都会进入正式 Release 发布流程
- 例如 `v0.0.1-test` 这类 Tag 也会创建真实的 GitHub Release

如果确实要用测试 Tag 验证完整 Release 流程，需明确知道它会创建一个真实 Release。

触发完成后，到 GitHub：

1. 打开仓库 `Actions`
2. 查看 `package-desktop-demo` workflow
3. 确认四条矩阵构建都成功
4. 确认 `release` job 成功
5. 打开对应 Tag 的 `Release`
6. 检查是否已出现四个 zip 下载项

---

## 现在用户能看到什么

当前发布完成后，GitHub Release 页面会直接呈现：

- Tag 对应的 Release
- 自动生成的 Release notes
- 四类发布资产的 zip 下载附件

也就是说，最终用户不需要自己进入 Actions 下载 artifact，而是可以直接在 Release 页面下载：

- macOS x64 包
- macOS arm64 包
- Windows portable 包
- Linux 包

这是本次改造最关键的交付结果。

---

## 当前设计边界

这套流程已经可用，但当前仍然是“最小可发布版本”，边界如下：

- 目前上传的是 zip 压缩包，不是正式安装器
- 当前 Release 资产中，Windows 对应的是 `portable` 产物；macOS 与 Linux 仍然是目录型产物归档
- 还没有接入代码签名、公证或 notarization
- 还没有提供 `dmg`、`nsis`、`AppImage` 这类更正式的分发格式
- 还没有生成 checksum

因此，当前最准确的描述是：

- 已具备自动化打包与自动化 Release 分发能力
- 已能在打 Tag 后直接提供下载入口
- 但分发物仍然是 zip 形式的应用产物，而非完整签名安装包

---

## 本次落地涉及的关键文件

- [package-desktop-demo.yml](/Users/xugang/codespace/krillinai/clawee-desktop-demo/.github/workflows/package-desktop-demo.yml)
- [build-openclaw-demo.ts](/Users/xugang/codespace/krillinai/clawee-desktop-demo/apps/desktop/scripts/build-openclaw-demo.ts)
- [package-desktop.ts](/Users/xugang/codespace/krillinai/clawee-desktop-demo/apps/desktop/scripts/package-desktop.ts)
- [build-desktop.ts](/Users/xugang/codespace/krillinai/clawee-desktop-demo/apps/desktop/scripts/build-desktop.ts)
- [electron-builder.json](/Users/xugang/codespace/krillinai/clawee-desktop-demo/apps/desktop/electron-builder.json)

---

## 后续可继续演进的方向

如果后面要继续提升发布质量，建议按这个顺序推进：

1. 将当前目录型产物进一步升级为更适合分发的格式
2. macOS 增加 `dmg`
3. Windows 在 `portable` 之外增加 `nsis`
4. Linux 增加 `AppImage`
5. 增加签名、公证与 checksum

但无论是否继续做这些增强，当前这条链路已经满足一个明确目标：

**只要推送符合规则的 Tag，GitHub Release 页面就会自动出现可下载的桌面应用压缩包。**
