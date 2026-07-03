# 本地改完后一键同步到 GitHub

我已经给项目加了一个脚本：

- [github-sync.sh](/Users/luna/Documents/Together/github-sync.sh)

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
cd /Users/luna/Documents/Together
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
cd /Users/luna/Documents/Together
./github-sync.sh sync
```

如果你想自己写这次更新说明，也可以：

```bash
./github-sync.sh sync "调整首页和账本样式"
```

## 你以后最常用的，其实只有这一句

```bash
./github-sync.sh sync
```

同步成功后，GitHub Actions 会自动部署到 Firebase Hosting。
