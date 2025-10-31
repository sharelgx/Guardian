# 图标文件

请将以下尺寸的图标文件放在此目录：

- icon16.png (16x16) - 浏览器工具栏小图标
- icon48.png (48x48) - 扩展管理页面
- icon128.png (128x128) - Chrome应用商店

## 生成图标

可以使用在线工具生成：
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

或使用命令行工具：
```bash
# 使用ImageMagick生成不同尺寸
convert source.png -resize 16x16 icon16.png
convert source.png -resize 48x48 icon48.png
convert source.png -resize 128x128 icon128.png
```

## 临时占位符

可以使用emoji作为临时图标：
- 🛡️ (shield) - 保护的象征
- 🔒 (lock) - 安全锁定
