# 🛡️ Guardian - 浏览器保护助手

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-88%2B-brightgreen.svg)
![Edge](https://img.shields.io/badge/Edge-88%2B-blue.svg)

**智能网址过滤和上网监控工具，帮助培养健康上网习惯**

[功能特点](#-功能特点) • [快速开始](#-快速开始) • [使用指南](#-使用指南) • [文档](#-文档) • [常见问题](#-常见问题)

</div>

---

## 📋 项目简介

Guardian 是一款完全独立的浏览器保护扩展，专为教育场景设计，帮助学生培养健康的上网习惯，同时为家长和教师提供有效的监督工具。

### 核心理念

> **守护而非管控，引导而非禁止**

Guardian（守护者）代表着温和的引导和保护，而不是强制的限制和监控。我们相信，通过正向激励和透明的数据反馈，可以帮助学生建立自律的上网习惯。

---

## ✨ 功能特点

### 🚫 网址过滤
- **黑名单模式**：拦截指定的不良网站
- **白名单模式**：只允许访问学习相关网站
- **通配符支持**：`*.example.com` 批量匹配子域名
- **实时拦截**：访问立即拦截，延迟<50ms

### 📊 上网监控
- **访问日志**：记录所有访问的网站和时间
- **统计分析**：今日拦截次数、访问次数、使用时长
- **数据导出**：支持CSV格式导出，便于分析
- **可视化展示**：直观的图表和报表

### ⚠️ 违规追踪（独家功能）
- **操作记录**：自动记录关闭保护、禁用插件、卸载插件等行为
- **用户追溯**：精确记录是谁、什么时间进行的操作
- **实时警报**：违规操作立即记录，防止逃避监督

### 🕐 时间管理
- **时长限制**：设置每日最大上网时长
- **时间段控制**：设置允许上网的时间段（开发中）
- **临时通行证**：管理员密码授权临时访问

### 🖥️ 独立管理后台
- **Web界面**：现代化的管理面板
- **7大功能模块**：仪表盘、黑名单、白名单、日志、违规记录、时间管理、设置
- **实时数据**：自动刷新，数据同步

### 🔗 可选集成
- **完全独立**：无需依赖任何第三方系统
- **灵活集成**：可集成到在线教育平台（如MetaSeekOJ）
- **API接口**：提供完整的消息接口
- **课堂模式**：支持课堂实时监控和上报

---

## 🚀 快速开始

### 前置要求

- Chrome 88+ 或 Edge 88+ 浏览器
- Python 3.x（用于运行管理后台）

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/sharelgx/Guardian.git
cd Guardian
```

#### 2. 安装浏览器插件

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」
4. 选择项目中的 `extension/` 文件夹
5. 完成！工具栏会出现Guardian图标

#### 3. 激活插件 🔑

**首次使用需要激活码**

安装后访问任意网站，会自动跳转到激活页面。

**免费演示激活码**（永久有效）：
```
GUARD-DEMO-2025-TEST-0001
```

或使用其他内置激活码：
- `GUARD-EDU-2025-PERM-0001`（教育版）
- `GUARD-TRIAL-30DAYS-0001`（试用30天）

详见：[激活码使用说明](docs/激活码使用说明.md)

#### 4. 启动管理后台

```bash
# 方式1：使用启动脚本（推荐）
./start.sh

# 方式2：手动启动
cd admin-panel
python3 -m http.server 8888
```

访问管理后台：http://localhost:8888

---

## 📖 使用指南

### 基础使用

#### 方式1：通过插件弹窗（最简单）

1. 访问要拦截的网站（如 www.bilibili.com）
2. 点击浏览器工具栏的Guardian图标
3. 开启「启用保护」开关
4. 点击「🚫 加入黑名单」
5. 刷新页面 → 网站被拦截！

#### 方式2：通过管理后台

1. 打开管理后台：http://localhost:8888
2. 左侧点击「黑名单」
3. 输入域名：`bilibili.com`
4. 点击「添加到黑名单」
5. 仪表盘开启「启用保护」

**注意**：目前需要在插件的Service Worker控制台手动同步配置（后续版本会自动同步）

### 高级配置

#### 使用Service Worker控制台配置

1. 打开 `chrome://extensions/`
2. 找到Guardian，点击「Service Worker」
3. 在控制台运行配置脚本：

```javascript
// 快速配置：启用保护 + 添加黑名单
chrome.storage.local.set({
  guardian_config: {
    enabled: true,
    mode: 'blacklist',
    blacklist: ['bilibili.com', 'douyin.com', 'iqiyi.com'],
    whitelist: [],
    stats: { todayBlocked: 0, totalBlocked: 0, todayAllowed: 0 },
    userInfo: { userId: 'user001', username: '张三' }
  }
}, () => {
  console.log('✅ 配置成功！');
});
```

---

## 🎯 使用场景

### 场景1：家庭 - 家长监督孩子上网

**配置**：
- 模式：黑名单
- 黑名单：游戏、视频、社交网站
- 每日时长：2小时
- 设置密码保护

**效果**：
- 孩子无法访问娱乐网站
- 超时自动限制
- 如果孩子关闭保护 → 自动记录违规
- 家长查看报告，了解上网习惯

### 场景2：学校 - 课堂专注管理

**配置**：
- 模式：白名单
- 白名单：教学网站、百度、维基百科
- 绑定学生信息
- 启用课堂模式

**效果**：
- 上课只能访问学习网站
- 访问其他网站立即拦截
- 实时上报给课堂系统
- 教师查看学生上网行为

### 场景3：企业 - 工作时间管理

**配置**：
- 模式：黑名单
- 黑名单：购物、视频、游戏网站
- 工作时段：09:00-18:00

**效果**：
- 工作时间禁止娱乐
- 提高工作效率
- 生成使用报告

---

## 📡 API文档

### Chrome Extension Messaging

Guardian 提供完整的消息接口，支持与其他系统集成。

#### 启用课堂模式

```javascript
chrome.runtime.sendMessage('插件ID', {
  action: 'enableClassroomMode',
  data: {
    sessionId: 123,
    serverUrl: 'http://your-server.com',
    allowedDomains: ['example.com', 'baidu.com']
  }
}, (response) => {
  console.log(response.message); // "课堂模式已启用"
});
```

#### 绑定用户信息

```javascript
chrome.runtime.sendMessage('插件ID', {
  action: 'bindUser',
  data: {
    userId: 'student001',
    username: '张三'
  }
});
```

#### 更多API

查看完整API文档：[API Reference](docs/API.md)

---

## 🔗 与教育平台集成

Guardian 可以轻松集成到在线教育平台，如 [MetaSeekOJ](https://github.com/QingdaoU/OnlineJudge)。

### 集成示例

```javascript
// 学生加入课堂时
window.addEventListener('classroom-join', async (event) => {
  const { sessionId, student } = event.detail;
  
  // 启用Guardian保护
  await chrome.runtime.sendMessage('插件ID', {
    action: 'enableClassroomMode',
    data: {
      sessionId: sessionId,
      serverUrl: window.location.origin,
      allowedDomains: ['your-platform.com', 'baidu.com']
    }
  });
});
```

详细集成文档：[Integration Guide](docs/INTEGRATION.md)

---

## 🛠️ 技术栈

- **浏览器插件**：Chrome Extension Manifest V3
- **编程语言**：JavaScript (ES6+)
- **管理后台**：HTML5 + CSS3 + Vanilla JavaScript
- **数据存储**：Chrome Storage API (本地存储)
- **API通信**：Chrome Runtime Messaging

---

## 📦 项目结构

```
Guardian/
├── extension/              # 浏览器插件
│   ├── manifest.json      # 插件配置
│   ├── background.js      # 后台服务（核心逻辑）
│   ├── content.js         # 内容脚本
│   ├── popup/            # 插件弹窗UI
│   ├── options/          # 设置页面
│   └── blocked/          # 拦截提示页面
│
├── admin-panel/          # 管理后台
│   ├── index.html       # 主页面
│   ├── css/             # 样式文件
│   └── js/              # JavaScript逻辑
│
├── docs/                 # 文档
│   ├── API.md
│   ├── INTEGRATION.md
│   └── CHANGELOG.md
│
├── README.md            # 本文件
├── LICENSE              # 开源协议
└── start.sh             # 快速启动脚本
```

---

## 📊 核心功能演示

### 拦截页面

当访问被拦截的网站时，会看到：

```
        🛡️
   此网站已被保护
   
该网站暂时无法访问

被拦截网站：www.example.com

  [返回上一页]  [申请临时访问]
```

### 管理后台

现代化的Web管理界面，包含：
- 📊 仪表盘：总览保护状态和统计
- 🚫 黑名单：管理拦截网站列表
- ✅ 白名单：管理允许网站列表
- 📝 访问日志：查看所有访问记录
- ⚠️ 违规记录：追踪绕过保护的行为
- ⏰ 时间管理：时长限制
- ⚙️ 系统设置：密码等配置

---

## 🔐 隐私与安全

Guardian 高度重视用户隐私：

- ✅ **完全本地运行**：所有数据存储在本地浏览器
- ✅ **无云端上传**：默认不上传任何数据到服务器
- ✅ **可选上报**：课堂模式的数据上报需要主动配置
- ✅ **开源透明**：代码完全开源，可自行审计
- ✅ **最小权限**：只请求必要的浏览器权限

### 数据说明

- **存储位置**：Chrome Storage API（本地）
- **数据类型**：域名、时间戳、统计数据
- **不记录**：密码、表单内容、个人隐私信息
- **保留期限**：访问日志最多1000条，自动清理旧数据

---

## 🤝 参与贡献

欢迎参与Guardian的开发！

### 贡献方式

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

### 开发指南

- 遵循JavaScript ES6+规范
- 代码添加详细注释
- 提交前测试所有功能
- 更新相关文档

---

## 📚 文档

- 📖 [快速开始指南](docs/QUICKSTART.md) - 3分钟快速上手
- 📖 [安装指南](docs/INSTALL.md) - 详细安装步骤
- 🔑 [激活码说明](docs/激活码使用说明.md) - 激活码获取和使用
- 📖 [使用指南](docs/简单使用指南.md) - 图文使用教程
- 📖 [常用命令](docs/常用命令.md) - Service Worker命令集合
- 📖 [课堂集成](docs/课堂集成使用指南.md) - 与教育平台集成
- 📖 [故障排除](docs/troubleshooting.md) - 常见问题解决
- 📖 [项目总结](docs/PROJECT_SUMMARY.md) - 完整技术文档

---

## 📝 更新日志

### v1.0.0 (2025-10-31)

**首次发布**

- ✅ 黑名单/白名单拦截功能
- ✅ 访问日志和统计
- ✅ 违规操作追踪
- ✅ 独立Web管理后台
- ✅ 时间管理功能
- ✅ 课堂模式（可选）
- ✅ 临时通行证
- ✅ 密码保护

---

## ❓ 常见问题

### Q: 学生能绕过插件吗？

**A**: 技术上可以（禁用插件、使用其他浏览器等），但Guardian会记录所有绕过行为，包括：
- 关闭保护的时间和用户
- 禁用插件的记录
- 卸载插件前的最后记录

配合家长/教师监督和正向激励，效果更佳。

### Q: 会影响浏览器性能吗？

**A**: 影响极小：
- 内存占用：~20MB
- CPU使用：<1%
- 页面加载延迟：<50ms

### Q: 支持移动端吗？

**A**: 目前仅支持桌面Chrome/Edge浏览器。移动端需要单独开发。

### Q: 数据安全吗？

**A**: 非常安全：
- 所有数据存储在本地
- 不上传到任何服务器（除非启用课堂模式并配置）
- 开源代码可审计

### Q: 可以集成到我的平台吗？

**A**: 可以！Guardian提供完整的消息接口，支持与任何Web平台集成。查看[集成文档](docs/INTEGRATION.md)。

---

## 📄 开源协议

MIT License

Copyright (c) 2025 Guardian Team

详见 [LICENSE](LICENSE) 文件。

---

## 📞 联系方式

- **GitHub Issues**: [提交问题](https://github.com/sharelgx/Guardian/issues)
- **GitHub Discussions**: [讨论交流](https://github.com/sharelgx/Guardian/discussions)
- **Email**: support@guardian.com

---

## 🌟 Star History

如果Guardian对您有帮助，请给我们一个Star ⭐

---

## 🙏 致谢

感谢所有为Guardian做出贡献的开发者和用户！

特别感谢：
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- 所有提供反馈和建议的用户

---

## 🎓 教育价值

Guardian 不仅是一个技术工具，更是一个教育工具：

### 对学生
- 培养自律能力
- 学会时间管理
- 建立健康上网习惯

### 对家长
- 了解孩子上网情况
- 温和引导而非强制
- 建立信任关系

### 对教师
- 课堂专注管理
- 了解学生行为模式
- 优化教学策略

---

<div align="center">

**守护成长，智慧上网**

Made with ❤️ by Guardian Team

[⬆ 回到顶部](#️-guardian---浏览器保护助手)

</div>
