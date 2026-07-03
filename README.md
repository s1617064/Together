# 共同记账 APP 起步版

这个目录现在包含两部分内容：

- 一个可直接打开预览的静态原型，先把首页时间轴、共同记账、记账人标识跑通。
- 一份偏落地的实施方案，重点围绕“两个人使用、能同步、费用尽量低”来设计。

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

- [prototype/index.html](/Users/luna/Documents/Together/prototype/index.html)
  可直接打开的原型首页
- [prototype/styles.css](/Users/luna/Documents/Together/prototype/styles.css)
  原型样式
- [prototype/app.js](/Users/luna/Documents/Together/prototype/app.js)
  原型交互逻辑，支持本地演示和可选 Firebase 云端模式
- [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js)
  Firebase 运行配置，默认关闭
- [prototype/firebase-config.example.js](/Users/luna/Documents/Together/prototype/firebase-config.example.js)
  Firebase 配置示例
- [prototype/firebase-service.js](/Users/luna/Documents/Together/prototype/firebase-service.js)
  Firebase Auth + Firestore 数据层
- [docs/mvp-plan.md](/Users/luna/Documents/Together/docs/mvp-plan.md)
  产品方案、同步方案、费用控制建议
- [docs/firestore.rules.example](/Users/luna/Documents/Together/docs/firestore.rules.example)
  两人共享账本的 Firestore 权限规则示例
- [docs/firebase-live-setup.md](/Users/luna/Documents/Together/docs/firebase-live-setup.md)
  把当前原型切到真实登录和云同步的步骤
- [docs/firebase-console-checklist.md](/Users/luna/Documents/Together/docs/firebase-console-checklist.md)
  Firebase 控制台逐项核对清单
- [docs/firebase-hosting-deploy.md](/Users/luna/Documents/Together/docs/firebase-hosting-deploy.md)
  Firebase Hosting 部署步骤
- [docs/github-hosting-setup.md](/Users/luna/Documents/Together/docs/github-hosting-setup.md)
  GitHub 自动发布到 Firebase Hosting 的步骤
- [docs/mobile-readiness.md](/Users/luna/Documents/Together/docs/mobile-readiness.md)
  手机正式使用检查清单

## 怎么预览

直接用浏览器打开 [prototype/index.html](/Users/luna/Documents/Together/prototype/index.html) 就可以看。

如果不填 Firebase 配置，它会继续走本地演示模式。

如果要打开真实登录和实时同步：

1. 参考 [docs/firebase-live-setup.md](/Users/luna/Documents/Together/docs/firebase-live-setup.md)
2. 把 [prototype/firebase-config.example.js](/Users/luna/Documents/Together/prototype/firebase-config.example.js) 里的内容填进 [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js)
3. 把 `enabled` 改成 `true`

## 下一步最适合做什么

如果你认可这个方向，下一步建议我们直接进入：

1. 把这个原型升级成真实可登录、可同步的数据版
2. 接入 Firebase
3. 做“邀请老婆加入同一本账本”的流程
4. 补充月度统计、分类汇总、预算提醒
