#!/bin/bash
# Guardian 浏览器保护插件 - 快速启动脚本

echo "🛡️  Guardian 浏览器保护插件 - 启动脚本"
echo "========================================"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python"
    exit 1
fi

# 启动管理后台
echo "📊 启动管理后台..."
cd admin-panel
python3 -m http.server 8888 &
SERVER_PID=$!

echo "✅ 管理后台已启动: http://localhost:8888"
echo ""
echo "📋 下一步："
echo "1. 在浏览器打开: chrome://extensions/"
echo "2. 开启'开发者模式'"
echo "3. 点击'加载已解压的扩展程序'"
echo "4. 选择目录: $(pwd)/extension/"
echo "5. 访问管理后台: http://localhost:8888"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务器...'; kill $SERVER_PID 2>/dev/null; echo '✅ 已停止'; exit 0" INT

# 保持运行
wait $SERVER_PID

