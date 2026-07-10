# 本地改完后一键同步到 GitHub

我已经给项目加了一个脚本：

- [github-sync.sh](../github-sync.sh)

它的目标是：

- 第一次做一次本地仓库初始化
- 以后每次只需要一条命令就能同步到 GitHub
- 同步前自动帮你检查这次改动是否落在正式范围内

## 第一次使用

先准备好你的 GitHub 仓库地址，例如：

```text
https://github.com/你的用户名/你的仓库名.git
```

然后在项目目录运行：

```bash
cd <你的 Together 仓库目录>
chmod +x ./github-sync.sh
./github-sync.sh init 你的_GitHub_仓库地址
```

例如：

```bash
./github-sync.sh init https://github.com/your-name/together.git
```

这一步会自动完成：

- 本地初始化 Git
- 绑定 `origin`
- 首次提交
- 推送到 `main`

## 后续每次同步

以后我在本地帮你改完文件，你只需要运行：

```bash
cd <你的 Together 仓库目录>
./github-sync.sh check
./github-sync.sh sync
```

在执行这一步前，请先确认：

- 正式改动只发生在 `prototype/`
- 如果这次改的是文档、脚本或工作流，也只应落在正式范围内
- `prototype-draft/` 只是草稿，不作为上线来源
- `.tmp-*`、`tmp/`、`outputs/` 只是本地临时目录

如果你想自己写这次更新说明，也可以：

```bash
./github-sync.sh sync "调整首页和账本样式"
```

## `check` 会帮你看什么

运行：

```bash
./github-sync.sh check
```

你会看到三种结果：

- 本次允许同步的正式改动
- 本地草稿或临时改动
- 正式范围外改动

脚本的默认正式范围是：

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

如果脚本提示“正式范围外的改动”，这次就不会继续同步。这样做的目的就是防止误把草稿、截图、临时文件带上去。

如果脚本提示本地草稿或临时改动，这次也会先停下来。这样能避免你以为它“自动跳过了”，实际上却把工作区留在一个容易误提交流程里。

## 你以后最常用的，其实只有这一句

```bash
./github-sync.sh sync
```

同步成功后，GitHub Actions 会自动部署到 Firebase Hosting。

如果你不确定这次会不会带上不该提交的文件，先运行一次：

```bash
./github-sync.sh check
```

## 当前目录约定

为了避免“改了但不是正式版”的问题，当前项目统一约定：

- 当前这份 Together 仓库根目录：唯一正式开发与发布目录
- `prototype/`：唯一正式前端源目录
- `prototype-draft/`、`.tmp-*`、`tmp/`、`outputs/`：本地草稿或临时目录

如果你只是准备发布正式版，请优先检查 `prototype/` 下有没有你要的改动。

## GitHub Desktop 怎么配合看

如果你用 GitHub Desktop 而不是脚本，提交前建议这样做：

1. 先看 `Changes` 里是不是只有正式文件。
2. 正式页面改动，优先只勾 `prototype/` 下的文件。
3. 如果这次顺带改了文档或流程文件，再勾 `docs/`、`README.md`、脚本等正式文件。
4. 如果看到 `prototype-draft/`、`.tmp-*`、`tmp/`、`outputs/`、截图或导出文件，先不要提交。
5. 如果不确定，就回到终端先运行 `./github-sync.sh check`，确认正式范围后再提交。
