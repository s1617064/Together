# Firebase 正式版接入

这份说明对应当前原型目录里的 Firebase 骨架：

- [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js)
- [prototype/firebase-config.example.js](/Users/luna/Documents/Together/prototype/firebase-config.example.js)
- [prototype/firebase-service.js](/Users/luna/Documents/Together/prototype/firebase-service.js)

## 目标

把现在这套原型从“本地演示模式”切到：

- 邮箱密码登录
- 两个人共用同一本账本
- Firestore 实时同步

## 你要改的地方

### 1. 创建 Firebase 项目

在 Firebase Console 里创建一个项目，然后开启：

- Authentication
- Cloud Firestore

### 2. 开启邮箱密码登录

在 Authentication 里启用：

- `Email/Password`

控制台路径：

- `Build`
- `Authentication`
- `Sign-in method`
- 打开 `Email/Password`

### 3. 建立 Web App

在 Firebase 项目里创建一个 Web App，然后拿到 `firebaseConfig`。

控制台路径：

- 项目首页
- 点击 `</>` 新建 Web App
- 注册完成后会看到一段 `firebaseConfig`

### 4. 填配置文件

把 [prototype/firebase-config.example.js](/Users/luna/Documents/Together/prototype/firebase-config.example.js) 的内容复制到 [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js)，然后把这些值换成你自己的：

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

同时把：

- `enabled: false`

改成：

- `enabled: true`

### 5. 保留公开配置，成员身份走云端

现在这套骨架不再要求你把真实邮箱写进前端配置文件。

也就是说：

- `prototype/firebase-config.js` 里只保留项目配置
- `members` 里只放公开的昵称和颜色标识
- 真正的成员身份会从 Firestore 的 `members/{auth.uid}` 文档里读取

## 最短接法

如果你想最快跑通，不用一次性做很多事，最短只要这 4 步：

1. 建 Firebase 项目
2. 打开 `Email/Password`
3. 建 Web App，拿到 `firebaseConfig`
4. 把项目配置填进 [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js)

填完之后：

- 把 `enabled` 改成 `true`
- 重新打开 [prototype/index.html](/Users/luna/Documents/Together/prototype/index.html)

如果配置没填完整，登录页现在会直接告诉你缺哪几项。

## 你现在可以直接发我的东西

如果你想让我继续帮你把本地文件直接填好，你下一条消息只要发这两类信息就行：

1. Firebase Web App 的 `firebaseConfig`
2. 你和宝要登录用的两个邮箱

我拿到之后就可以直接帮你把 [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js) 填好。

## 当前骨架已经做好的事

### 登录

- 如果 `firebase-config.js` 没开启，就只走本地演示。
- 如果开启了，就会在登录页出现邮箱密码登录表单。
- 登录成功后会自动进入云端模式。

### 数据同步

- 所有账目会写到 `books/{sharedBookId}/expenses`
- 成员信息会写到 `books/{sharedBookId}/members/{auth.uid}`
- 账目按 `spentAt` 倒序实时监听

### 权限逻辑

- 首页时间轴只展示
- 账本页保留编辑 / 删除
- 只有自己记的账可以改和删

## Firestore 规则

你可以从这里起步：

- [docs/firestore.rules.example](/Users/luna/Documents/Together/docs/firestore.rules.example)

不过当前前端骨架把成员文档写在：

- `books/{bookId}/members/{auth.uid}`

所以这个规则示例和现在的前端结构是匹配的。

## 现阶段的限制

当前我做的是“可接正式版”的骨架，不是完整生产版，所以还没补这些东西：

- 忘记密码
- 邮箱验证
- 邀请链接
- 账本切换
- 多账本支持
- 离线冲突处理

## 我建议的下一步

最合理的继续顺序是：

1. 先把 Firebase 配置填好
2. 先验证两个人能登录、能看到同一份数据
3. 再做邀请加入流程
4. 再补正式安全规则和部署
