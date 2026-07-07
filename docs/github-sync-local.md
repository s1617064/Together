# 本地改完后一键同步到 GitHub

我已经给项目加了一个脚本：

- [github-sync.sh](../github-sync.sh)

它的目标是：

- 第一次做一次本地仓库初始化
- 以后每次只需要一条命令就能同步到 GitHub

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
./github-sync.sh sync
```

在执行这一步前，请先确认：

- 正式改动只发生在 `prototype/`
- `prototype-draft/` 只是草稿，不作为上线来源
- `.tmp-*`、`tmp/`、`outputs/` 只是本地临时目录

如果你想自己写这次更新说明，也可以：

```bash
./github-sync.sh sync "调整首页和账本样式"
```

## 你以后最常用的，其实只有这一句

```bash
./github-sync.sh sync
```

同步成功后，GitHub Actions 会自动部署到 Firebase Hosting。

## 当前目录约定

为了避免“改了但不是正式版”的问题，当前项目统一约定：

- 当前这份 Together 仓库根目录：唯一正式开发与发布目录
- `prototype/`：唯一正式前端源目录
- `prototype-draft/`、`.tmp-*`、`tmp/`、`outputs/`：本地草稿或临时目录

如果你只是准备发布正式版，请优先检查 `prototype/` 下有没有你要的改动。
