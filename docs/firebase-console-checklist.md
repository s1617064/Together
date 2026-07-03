# Firebase 控制台核对清单

你现在本地配置已经填好了，接下来主要看 Firebase 控制台。

## 必须完成的 4 件事

### 1. Authentication 打开邮箱密码登录

控制台路径：

- `Build`
- `Authentication`
- `Sign-in method`
- 打开 `Email/Password`

核对结果应该是：

- `Email/Password` 已启用

### 2. Firestore 数据库已经创建

控制台路径：

- `Build`
- `Firestore Database`
- `Create database`

建议：

- 先选离你们更近的区域
- 模式可以先建出来，随后马上把规则替换成项目里的规则

核对结果应该是：

- 数据库已经存在

### 3. Firestore 规则已经替换

控制台路径：

- `Build`
- `Firestore Database`
- `Rules`

把这里的规则替换成：

- [docs/firestore.rules.example](/Users/luna/Documents/Together/docs/firestore.rules.example)

核对结果应该是：

- 已发布规则

### 4. 登录账号和成员身份一致

本地文件：

- [prototype/firebase-config.js](/Users/luna/Documents/Together/prototype/firebase-config.js)

核对结果应该是：

- 两个人都能登录成功
- 登录后能自动识别成 `抖` 和 `宝`
- 成员身份来自 `books/{sharedBookId}/members/{auth.uid}`

## 最快验证方法

### 第一步

在本地启动原型，建议走 `localhost`，不要继续直接打开 `file://`。

### 第二步

打开登录页，看是否已经出现“正式版登录”表单。

如果没有出现：

- 说明还有配置或页面运行环境问题

### 第三步

先用 `抖` 的邮箱注册或登录。

成功后，Firestore 里应该会自动出现：

- `books/dou-bao-home`
- `books/dou-bao-home/members/{auth.uid}`

### 第四步

再用 `宝` 的邮箱登录。

成功后，两个人看到的应该是同一本账本。

## 如果还不通，最常见就这几类

- `Email/Password` 没启用
- Firestore 还没创建
- Firestore 规则没发
- 登录邮箱和本地配置不一致
- 还在 `file://` 下直接打开页面
