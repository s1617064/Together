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

- [docs/firestore.rules.example](firestore.rules.example)

核对结果应该是：

- 已发布规则

### 4. 登录账号和成员身份一致

本地文件：

- [prototype/firebase-config.js](../prototype/firebase-config.js)

核对结果应该是：

- 两个人都能登录成功
- 登录后能自动识别成 `抖` 和 `宝`
- 成员身份来自 `books/{sharedBookId}/members/{auth.uid}`
- 只有看到“云同步已连接”，才算真正连到账本

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

如果是新设备第一次登录，页面正常顺序应该是：

- 先看到“确认成员身份中”或类似提示
- 然后看到“正在完成成员绑定并接入共享账本”
- 最后看到“云同步已连接”

如果停在错误提示，不应该再出现“登录成功但没有数据也没有报错”的情况。

## 如果还不通，最常见就这几类

- `Email/Password` 没启用
- Firestore 还没创建
- Firestore 规则没发
- 登录邮箱和本地配置不一致
- 还在 `file://` 下直接打开页面

## 新版异常提示该怎么看

如果现在仍然连接不上，页面应该直接告诉你是哪一类：

- `这个账号还没有加入共享账本`
  说明该账号还没有被识别成账本成员
- `同步账本失败：当前账号还没有访问这本账本的权限`
  说明大概率是 Firestore 规则或成员写入顺序有问题
- `同步账本失败：当前网络不可用，请稍后再试`
  说明更像是离线或网络问题
