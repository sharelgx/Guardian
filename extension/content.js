// ============================================
// Guardian 浏览器保护插件 - 内容脚本
// ============================================

// 在页面中显示提示信息（可选）
console.log('Guardian 保护已激活');

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showNotification') {
    showPageNotification(message.text, message.type);
    sendResponse({ success: true });
  }
  return true;
});

// 在页面上显示通知
function showPageNotification(text, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `guardian-notification guardian-${type}`;
  notification.textContent = text;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s;
  `;
  
  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // 3秒后自动消失
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 防止页面检测到插件（可选的隐身模式）
// 某些网站可能会检测浏览器插件

