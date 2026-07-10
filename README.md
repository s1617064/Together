# 共同记账 APP 起步版

这个目录现在包含两部分内容：

- 一个可直接打开预览的静态原型，先把首页时间轴、共同记账、记账人标识跑通。
- 一份偏落地的实施方案，重点围绕“两个人使用、能同步、费用尽量低”来设计。

## 正式开发与发布目录

当前唯一正式开发与发布目录是：

- 当前这份 GitHub 本地仓库根目录

在这个正式仓库里，请统一遵守：

- `prototype/` 是唯一正式前端源目录，也是发布到 Firebase Hosting 的目录。
- 需要上线、需要提交、需要部署的前端文件，只能以 `prototype/` 里的版本为准。
- 如果使用同步脚本或 GitHub Desktop 提交，请默认只提交正式范围内的文件。

这意味着：

- 正式页面改动请只改 `prototype/index.html`、`prototype/styles.css`、`prototype/app.js` 以及 `prototype/` 下相关正式文件。
- 如果需要做设计草稿、临时实验、对比版本，请放在本地临时目录，不要把它们当成正式发布源。

## 本地草稿与临时目录约定

下面这些目录如果出现在仓库根目录，默认视为本地工作区，不参与正式发布：

- `prototype-draft/`
  只用于草稿设计、试验版交互、对比稿。
- `.tmp-*/`
  只用于临时覆盖、比对、修复过程中的中转文件。
- `tmp/`
  只用于本地脚本和中间产物。
- `outputs/`
  只用于导出文件或预览产物。

除非你明确要把它们转正，否则这些目录里的文件不应该作为上线依据。

## 提交与发布前的最小检查

为了避免“改了但不是正式目录”或“把草稿一起推上去”，现在推荐这样检查：

### 推荐提交范围

下面这些属于正式提交范围：

- `prototype/`
- `docs/`
- `.github/workflows/`
- `README.md`
- `AGENTS.md`
- `github-sync.sh`
- `firebase-hosting.sh`
- `firebase.json`
- `.firebaserc`
- `.gitignore`
- `issue.md`

### 不该进入正式提交的内容

下面这些默认都不该发布：

- `prototype-draft/`
- `.tmp-*/`
- `tmp/`
- `outputs/`
- 截图、临时导出文件、草稿对比稿

### 如果你用脚本同步

先检查一次：

```bash
./github-sync.sh check
```

确认没问题后再同步：

```bash
./github-sync.sh sync
```

脚本现在会：

- 只允许正式范围内的改动进入同步流程
- 发现草稿、临时文件或正式范围外改动时直接中止
- 在提交前打印这次真正会进 GitHub 的文件列表

### 如果你用 GitHub Desktop

在 `Changes` 面板里只勾正式文件：

- 重点看 `prototype/`
- 如果这次同步包含文档或流程改动，再勾 `docs/`、`README.md`、脚本等正式文件
- 如果看到 `prototype-draft/`、`.tmp-*`、`tmp/`、`outputs/` 或截图文件，先不要提交

## 我给你的建议

第一版不要先做原生 iOS / Android 双端，而是先做 `PWA`。

原因很简单：

- 两个人使用，PWA 已经够用，手机桌面也可以像 APP 一样添加图标。
- 不需要一开始就付 Apple Developer 费用。
- 开发和迭代速度更快，先把记账流程和同步打磨好更重要。
- 后面如果你们真的长期用，再升级成 Flutter 或 React Native 也不晚。

## 推荐技术路线

- 前端：PWA
- 同步：Firebase Auth + Firestore
- 部署：Firebase Hosting

这条路线的优点是：

- 前期几乎可以做到 `0 元起步`
- 登录、数据库、同步、部署都能放在一个平台
- Firestore 自带实时同步能力，很适合“两个人共用一本账本”

## 目录说明

- [prototype/index.html](prototype/index.html)
  正式版入口，也是唯一正式前端页面
- [prototype/styles.css](prototype/styles.css)
  正式版样式
- [prototype/app.js](prototype/app.js)
  正式版交互逻辑，支持本地演示和可选 Firebase 云端模式
- [prototype/firebase-config.js](prototype/firebase-config.js)
  正式版 Firebase 运行配置，默认关闭
- [prototype/firebase-config.example.js](prototype/firebase-config.example.js)
  Firebase 配置示例
- [prototype/firebase-service.js](prototype/firebase-service.js)
  Firebase Auth + Firestore 数据层
- [docs/mvp-plan.md](docs/mvp-plan.md)
  产品方案、同步方案、费用控制建议
- [docs/firestore.rules.example](docs/firestore.rules.example)
  两人共享账本的 Firestore 权限规则示例
- [docs/firebase-live-setup.md](docs/firebase-live-setup.md)
  把当前原型切到真实登录和云同步的步骤
- [docs/firebase-console-checklist.md](docs/firebase-console-checklist.md)
  Firebase 控制台逐项核对清单
- [docs/firebase-hosting-deploy.md](docs/firebase-hosting-deploy.md)
  Firebase Hosting 部署步骤
- [docs/github-hosting-setup.md](docs/github-hosting-setup.md)
  GitHub 自动发布到 Firebase Hosting 的步骤
- [docs/mobile-readiness.md](docs/mobile-readiness.md)
  手机正式使用检查清单

## 怎么预览

直接打开 [prototype/index.html](prototype/index.html) 就是看正式版。

如果只是做草稿设计或试验，请不要在正式目录里直接混入临时文件。

如果不填 Firebase 配置，它会继续走本地演示模式。

如果要打开真实登录和实时同步：

1. 参考 [docs/firebase-live-setup.md](docs/firebase-live-setup.md)
2. 把 [prototype/firebase-config.example.js](prototype/firebase-config.example.js) 里的内容填进 [prototype/firebase-config.js](prototype/firebase-config.js)
3. 把 `enabled` 改成 `true`

## 下一步最适合做什么

如果你认可这个方向，下一步建议我们直接进入：

1. 把这个原型升级成真实可登录、可同步的数据版
2. 接入 Firebase
3. 做“邀请老婆加入同一本账本”的流程
4. 补充月度统计、分类汇总、预算提醒
