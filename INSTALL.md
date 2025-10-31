# Guardian 浏览器保护插件 - 安装指南

## 🚀 快速安装（5分钟）

### 步骤1：安装浏览器插件

#### Chrome / Edge 浏览器：

1. 打开浏览器，在地址栏输入：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. **开启"开发者模式"**（右上角）

3. 点击"加载已解压的扩展程序"

4. 选择项目文件夹：
   ```
   /home/sharelgx/MetaSeekOJdev/guardian-browser-extension/extension/
   ```

5. ✅ 安装完成！浏览器工具栏会出现 🛡️ Guardian 图标

### 步骤2：启动管理后台

#### 方式1：直接打开（推荐）

```bash
# 使用浏览器打开
open /home/sharelgx/MetaSeekOJdev/guardian-browser-extension/admin-panel/index.html

# 或使用Python启动本地服务器
cd /home/sharelgx/MetaSeekOJdev/guardian-browser-extension/admin-panel
python3 -m http.server 8888

# 然后访问: http://localhost:8888
```

#### 方式2：集成到MetaSeekOJ（可选）

如果您想在MetaSeekOJ系统中使用，参考后文"集成到MetaSeekOJ"章节。

### 步骤3：初始配置

1. 点击浏览器工具栏的 Guardian 图标
2. 点击"⚙️ 管理后台"按钮
3. 在管理后台设置：
   - 设置管理员密码
   - 添加黑名单/白名单
   - 启用保护

---

## 📖 详细使用指南

### 1. 基础功能

#### 1.1 启用/禁用保护

**方式1：通过插件弹窗**
- 点击浏览器工具栏 Guardian 图标
- 拖动"启用保护"开关

**方式2：通过管理后台**
- 打开管理后台
- 在仪表盘页面切换开关

#### 1.2 添加黑名单

**方式1：快速添加当前网站**
- 访问要拦截的网站
- 点击 Guardian 图标
- 点击"🚫 加入黑名单"

**方式2：在管理后台批量添加**
- 打开管理后台
- 进入"黑名单"页面
- 输入域名（如：bilibili.com）
- 点击"添加到黑名单"

#### 1.3 查看访问日志

- 打开管理后台
- 进入"📝 访问日志"页面
- 查看所有访问记录
- 可导出为CSV文件

---

### 2. 高级功能

#### 2.1 保护模式切换

**黑名单模式**（默认）：
- 默认允许所有网站
- 只拦截黑名单中的网站
- 适合：限制特定不良网站

**白名单模式**：
- 默认拦截所有网站
- 只允许白名单中的网站
- 适合：严格学习/工作场景

**切换方式**：
- 管理后台 → 仪表盘 → 保护模式下拉框

#### 2.2 时间管理

**每日时长限制**：
1. 管理后台 → ⏰ 时间管理
2. 开启"每日时长限制"
3. 设置最大分钟数（如：120分钟）
4. 保存设置

**效果**：超过时长后自动拦截所有网站

#### 2.3 临时通行证

如果需要临时访问被拦截的网站：

1. 访问被拦截网站，出现拦截页面
2. 点击"申请临时访问"
3. 输入管理员密码
4. 设置访问时长（如：10分钟）
5. 确认后可临时访问

---

### 3. 管理员密码

**首次设置**：
1. 管理后台 → ⚙️ 系统设置
2. 输入新密码
3. 确认密码
4. 保存

**用途**：
- 防止他人修改设置
- 授予临时通行证
- 暂时禁用保护

**忘记密码**：
- 打开插件目录
- 删除Chrome Storage数据重置

---

## 🔧 故障排除

### 问题1：插件安装失败

**错误**："无法加载扩展程序"

**解决方法**：
1. 确认已开启"开发者模式"
2. 检查文件夹路径是否正确
3. 确认 `manifest.json` 文件存在

### 问题2：拦截不生效

**可能原因**：
- 保护未启用 → 检查开关状态
- 域名格式错误 → 确认域名格式（不含http://）
- 模式设置错误 → 检查是黑名单还是白名单模式

### 问题3：管理后台打不开

**解决方法**：
```bash
# 确认文件存在
ls /home/sharelgx/MetaSeekOJdev/guardian-browser-extension/admin-panel/index.html

# 使用Python启动本地服务器
cd /home/sharelgx/MetaSeekOJdev/guardian-browser-extension/admin-panel
python3 -m http.server 8888

# 访问 http://localhost:8888
```

### 问题4：数据不同步

**现象**：管理后台显示的数据与插件不一致

**解决方法**：
1. 点击管理后台右下角"🔄 刷新数据"
2. 重新打开插件弹窗
3. 如果仍不同步，重启浏览器

---

## 📦 集成到MetaSeekOJ

如果您想将Guardian集成到MetaSeekOJ课堂系统中：

### 1. 添加到Django后端

在 `OnlineJudge/classroom/views.py` 中添加：

```python
from rest_framework.decorators import api_view

@api_view(['POST'])
def enable_browser_protection(request):
    """启用浏览器保护（课堂锁定）"""
    session_id = request.data.get('session_id')
    whitelist = request.data.get('whitelist', [])
    
    # 通过WebSocket通知所有学生浏览器
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'classroom_session_{session_id}',
        {
            'type': 'enable_browser_protection',
            'whitelist': whitelist
        }
    )
    
    return Response({'message': '浏览器保护已启用'})
```

### 2. 前端触发事件

在课堂页面 `OnlineJudgeFE/src/pages/classroom/student/views/Learning.vue`：

```javascript
methods: {
  async joinClassroom() {
    // 调用API加入课堂
    await this.$http.post(`/api/classroom/sessions/${this.sessionId}/join/`)
    
    // 触发浏览器插件
    window.dispatchEvent(new CustomEvent('guardian-enable', {
      detail: {
        sessionId: this.sessionId,
        whitelist: ['metaseekoj.com', 'baidu.com']
      }
    }))
  }
}
```

### 3. 插件监听事件

Guardian插件会自动监听 `guardian-enable` 事件并启用保护。

---

## 🎯 使用场景示例

### 场景1：家长日常监督

**配置**：
- 模式：黑名单
- 黑名单：bilibili.com, douyin.com, game.com
- 每日时长：120分钟

**效果**：
- 孩子无法访问视频、游戏网站
- 每天上网不超过2小时
- 家长可查看访问日志

### 场景2：学生在线学习

**配置**：
- 模式：白名单
- 白名单：metaseekoj.com, baidu.com, wikipedia.org
- 时长：不限制

**效果**：
- 只能访问学习相关网站
- 其他网站全部拦截
- 专注学习不分心

### 场景3：办公室上班

**配置**：
- 模式：黑名单
- 黑名单：淘宝、京东、游戏网站
- 时段：工作日 09:00-18:00

**效果**：
- 工作时间禁止购物、娱乐
- 下班后自动解除
- 提高工作效率

---

## 📊 数据说明

### 存储位置

所有数据存储在浏览器本地：
- Chrome: `chrome.storage.local`
- 位置：`~/.config/google-chrome/Default/Local Storage/`

### 数据备份

**导出配置**：
```javascript
// 在浏览器控制台运行
chrome.storage.local.get(null, data => {
  console.log(JSON.stringify(data, null, 2))
  // 复制输出内容保存为JSON文件
})
```

**导入配置**：
```javascript
// 准备配置数据
const config = {
  guardian_config: { /* 配置内容 */ }
}

// 导入
chrome.storage.local.set(config, () => {
  console.log('配置已导入')
})
```

---

## 🔐 隐私说明

Guardian 完全本地运行，不上传任何数据：

- ✅ 所有数据存储在本地浏览器
- ✅ 不连接任何外部服务器
- ✅ 不收集用户个人信息
- ✅ 开源代码，可自行审查

**访问日志**：
- 只记录域名，不记录完整URL
- 不包含表单数据、密码等敏感信息
- 可随时清空

---

## 🆘 获取帮助

### 文档

- 需求文档：`/home/sharelgx/MetaSeekOJdev/.trae/documents/浏览器插件需求文档.md`
- 开发文档：`/home/sharelgx/MetaSeekOJdev/.trae/documents/浏览器插件开发文档.md`

### 联系方式

- GitHub: https://github.com/guardian-extension
- Email: support@guardian.com
- Issues: https://github.com/guardian-extension/issues

---

## ✨ 更新日志

### v1.0.0 (2025-10-31)
- 🎉 首次发布
- ✅ 黑名单/白名单功能
- ✅ 访问日志记录
- ✅ 独立管理后台
- ✅ 时间管理功能
- ✅ 临时通行证

---

**祝您使用愉快！** 🎉

