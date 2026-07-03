# GitHub 自动发布到 Firebase Hosting

这个项目已经补好了 GitHub Actions 配置。接下来你只需要把项目放到 GitHub，再补一个仓库密钥，就可以做到：

- 推到 `main` 后自动发布正式版
- 开 Pull Request 时自动生成预览链接

相关文件：

- [.github/workflows/firebase-hosting-live.yml](/Users/luna/Documents/Together/.github/workflows/firebase-hosting-live.yml)
- [.github/workflows/firebase-hosting-preview.yml](/Users/luna/Documents/Together/.github/workflows/firebase-hosting-preview.yml)

## 你要做的 1 件准备

把本地这个服务账号 JSON 的全部内容复制出来：

- `/Users/luna/Documents/Together/together-b80a9-firebase-adminsdk-fbsvc-3dcdfd8868.json`

后面会把它存进 GitHub 仓库密钥里，不要把这个文件上传到仓库。

## 第一步：创建 GitHub 仓库

在 GitHub 新建一个仓库，比如：

- `together`

然后把当前项目内容上传上去。

注意：

- 不要把服务账号 JSON 上传到 GitHub
- `prototype/firebase-config.js` 里现在放的是前端 Firebase 配置，这个可以留在仓库里
- 真正敏感的是服务账号 JSON，只放进 GitHub Secrets

## 第二步：添加 GitHub Secret

打开你的 GitHub 仓库页面，进入：

1. `Settings`
2. `Secrets and variables`
3. `Actions`
4. `New repository secret`

名称填写：

```text
FIREBASE_SERVICE_ACCOUNT_TOGETHER_B80A9
```

内容填写：

- 本地服务账号 JSON 文件的完整内容

也就是把整个 JSON 原样粘进去。

## 第三步：推送到 main

当这些文件进入 GitHub 仓库，并且代码进入 `main` 分支后，GitHub 会自动运行：

- 正式发布流程：推送到 `main` 自动发到 Firebase Hosting
- 预览流程：开 PR 时生成一个临时预览链接

另外，正式发布流程也支持手动触发：

1. 打开 GitHub 仓库的 `Actions`
2. 进入 `Deploy To Firebase Hosting`
3. 点击 `Run workflow`
4. 选择 `main`
5. 点击绿色按钮运行

## 成功后你会看到什么

在 GitHub 仓库的 `Actions` 页面里，你会看到一次成功的工作流运行。

正式发布成功后，一般会继续发布到你当前的 Hosting 站点，也就是：

- `https://together-b80a9.web.app`
- `https://together-b80a9.firebaseapp.com`

## 这套方案为什么更适合你现在

你本机当前部署反复被网络认证超时打断，而 GitHub Actions 是在云端跑的，不依赖你本地连 Google 接口是否稳定，所以后续会省心很多。
