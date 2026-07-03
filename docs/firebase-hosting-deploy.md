# Firebase Hosting 部署

现在这个项目已经整理成可以直接发到 Firebase Hosting 的结构了。

关键文件：

- [firebase.json](/Users/luna/Documents/Together/firebase.json)
- [.firebaserc](/Users/luna/Documents/Together/.firebaserc)

## 当前部署目标

- Firebase 项目：`together-b80a9`
- Hosting 公共目录：`prototype`

## 推荐部署方式

这台机器上浏览器登录 Firebase CLI 已经反复报认证失效，所以这里更推荐直接用服务账号部署。这样更稳，也不依赖本机有没有全局安装 `node`、`npm`、`firebase`。

### 1. 下载服务账号 JSON

打开 Firebase 项目 `together-b80a9` 对应的 Google Cloud 控制台，进入：

1. `Project settings`
2. `Service accounts`
3. 选择 `Firebase Admin SDK`
4. 点击 `Generate new private key`

把下载下来的 JSON 放到这里：

```text
/Users/luna/Documents/Together/.firebase-service-account.json
```

这个文件已经被 `.gitignore` 忽略，不会被误提交。

### 2. 直接部署

项目根目录里已经准备好了部署脚本，所以只需要运行：

```bash
cd /Users/luna/Documents/Together
./firebase-hosting.sh deploy
```

如果你不想把 JSON 放在项目根目录，也可以显式指定路径：

```bash
cd /Users/luna/Documents/Together
./firebase-hosting.sh deploy --service-account /你的/JSON/完整路径.json
```

Firebase 官方文档里，Hosting 发布命令仍然是 `firebase deploy --only hosting`；这里的脚本只是帮你把内置运行环境和认证方式接好。[Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart)

## 这次我已经替你做好的事

所以你现在不需要再跑 `firebase init hosting`，因为：

- `firebase.json` 已经写好了
- `.firebaserc` 已经绑定了默认项目

也就是说，认证文件准备好以后，直接执行：

```bash
cd /Users/luna/Documents/Together
./firebase-hosting.sh deploy
```

## 部署成功后你会拿到什么

通常会得到类似这样的地址：

- `https://together-b80a9.web.app`
- `https://together-b80a9.firebaseapp.com`

之后你和宝就可以直接用手机打开这个网址。

## 如果部署后页面还是旧的

因为这个项目有 `service worker`，部署后如果你看到的还是旧界面，建议：

1. 手机或浏览器强刷
2. 关闭再重开页面
3. 必要时清掉这个站点缓存再打开

## 我建议的发布顺序

1. 先部署到 Hosting
2. 用 `抖` 手机打开验证登录
3. 用 `宝` 手机打开验证同步
4. 再测试新增、编辑、删除
