# 🚀 Guardian 推送到GitHub指南

**仓库地址**: https://github.com/sharelgx/Guardian  
**分支**: main

---

## ✅ 当前状态

- ✅ Git仓库已初始化
- ✅ 所有文件已添加
- ✅ 首次提交已创建
- ✅ 远程仓库已配置
- ✅ 分支已切换到main
- ⏳ 等待推送

---

## 🔐 配置GitHub认证

### 方式1：使用Personal Access Token（推荐）

#### 步骤1：生成Token

1. 访问：https://github.com/settings/tokens
2. 点击「Generate new token」→「Generate new token (classic)」
3. 设置：
   - Note: `Guardian推送`
   - Expiration: `90 days` 或 `No expiration`
   - 勾选：`repo` (所有权限)
4. 点击「Generate token」
5. **复制生成的token**（只显示一次！）

#### 步骤2：配置Git凭据

```bash
cd /home/sharelgx/MetaSeekOJdev/guardian-browser-extension

# 配置Git用户信息（如果还没配置）
git config user.name "sharelgx"
git config user.email "your-email@example.com"

# 使用token推送
git push -u origin main
# 提示输入用户名：输入 sharelgx
# 提示输入密码：粘贴刚才的token
```

---

### 方式2：使用SSH密钥（更安全）

#### 步骤1：生成SSH密钥

```bash
# 检查是否已有SSH密钥
ls -la ~/.ssh/id_*.pub

# 如果没有，生成新密钥
ssh-keygen -t ed25519 -C "your-email@example.com"
# 一路按回车（使用默认路径）

# 查看公钥
cat ~/.ssh/id_ed25519.pub
# 复制输出内容
```

#### 步骤2：添加到GitHub

1. 访问：https://github.com/settings/keys
2. 点击「New SSH key」
3. Title: `Guardian开发环境`
4. Key: 粘贴刚才复制的公钥
5. 点击「Add SSH key」

#### 步骤3：更改远程URL并推送

```bash
cd /home/sharelgx/MetaSeekOJdev/guardian-browser-extension

# 更改为SSH URL
git remote set-url origin git@github.com:sharelgx/Guardian.git

# 推送
git push -u origin main
```

---

## 📋 推送命令（完整版）

### 使用HTTPS + Token

```bash
cd /home/sharelgx/MetaSeekOJdev/guardian-browser-extension

# 1. 配置用户信息
git config user.name "sharelgx"
git config user.email "your-email@example.com"

# 2. 推送（会提示输入token）
git push -u origin main

# 提示时：
# Username: sharelgx
# Password: 粘贴你的GitHub Personal Access Token
```

### 使用SSH

```bash
cd /home/sharelgx/MetaSeekOJdev/guardian-browser-extension

# 1. 更改远程URL
git remote set-url origin git@github.com:sharelgx/Guardian.git

# 2. 推送
git push -u origin main
```

---

## ✅ 推送成功后

访问 https://github.com/sharelgx/Guardian 应该看到：

- ✅ README.md 显示在首页
- ✅ 43个文件
- ✅ 提交信息：「🎉 Initial commit: Guardian浏览器保护插件 v1.0.0」
- ✅ main 分支

---

## 🎯 后续操作

### 1. 设置仓库描述

在GitHub仓库页面：
- 点击「⚙️ Settings」
- Description: `🛡️ 智能浏览器保护插件 - 网址过滤、上网监控、违规追踪`
- Website: 留空或填写文档地址
- Topics: `chrome-extension`, `parental-control`, `web-filter`, `education`

### 2. 添加shields徽章

README.md 已经包含了版本、协议等徽章。

### 3. 创建Release

```bash
# 打包插件
cd extension
zip -r ../Guardian-v1.0.0.zip .

# 在GitHub创建Release
# 上传 Guardian-v1.0.0.zip
```

---

## 🐛 常见错误

### 错误1：Authentication failed

**原因**: Token无效或已过期

**解决**: 重新生成Token并使用

### 错误2：Permission denied (publickey)

**原因**: SSH密钥未添加到GitHub

**解决**: 按照SSH方式重新配置

### 错误3：Repository not found

**原因**: 仓库URL错误

**解决**: 
```bash
git remote -v  # 查看当前URL
git remote set-url origin https://github.com/sharelgx/Guardian.git
```

---

## 📞 需要帮助？

把错误信息告诉我，我来帮您解决！

常见提示：
- `Username for 'https://github.com':` → 输入 `sharelgx`
- `Password for 'https://sharelgx@github.com':` → 粘贴Personal Access Token（不是GitHub密码）

