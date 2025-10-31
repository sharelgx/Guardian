// ============================================
// Guardian 拦截页面脚本
// ============================================

let blockedUrl = '';
let blockedDomain = '';

// 页面加载
document.addEventListener('DOMContentLoaded', () => {
  loadBlockedInfo();
  setupEventListeners();
});

// 加载被拦截的URL信息
function loadBlockedInfo() {
  const params = new URLSearchParams(window.location.search);
  blockedUrl = params.get('url') || '未知网站';
  const reason = params.get('reason') || '该网站暂时无法访问';
  
  try {
    const url = new URL(blockedUrl);
    blockedDomain = url.hostname;
  } catch (e) {
    blockedDomain = blockedUrl;
  }
  
  document.getElementById('blockedUrl').textContent = blockedUrl;
  document.getElementById('reason').textContent = reason;
}

// 设置事件监听
function setupEventListeners() {
  // 返回上一页
  document.getElementById('goBack').addEventListener('click', () => {
    window.history.back();
  });
  
  // 申请临时访问
  document.getElementById('requestPass').addEventListener('click', async () => {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'flex';
  });
  
  // 打开管理后台
  document.getElementById('openAdmin').addEventListener('click', (e) => {
    e.preventDefault();
    window.open('http://localhost:8888', '_blank');
  });
  
  // 暂时禁用保护
  document.getElementById('disableProtection').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const confirmed = confirm('确定要暂时禁用保护吗？这将允许访问所有网站。');
    if (confirmed) {
      const response = await chrome.runtime.sendMessage({
        action: 'toggleEnabled'
      });
      
      if (response.success && !response.enabled) {
        alert('保护已禁用，您可以访问所有网站了。');
        window.location.href = blockedUrl;
      }
    }
  });
  
  // 密码弹窗
  document.getElementById('cancelPassword').addEventListener('click', () => {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('passwordInput').value = '';
    document.getElementById('errorMessage').textContent = '';
  });
  
  document.getElementById('confirmPassword').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const errorMsg = document.getElementById('errorMessage');
    
    if (!password) {
      errorMsg.textContent = '请输入密码';
      return;
    }
    
    // 验证密码
    const verifyResponse = await chrome.runtime.sendMessage({
      action: 'verifyPassword',
      data: { password: password }
    });
    
    if (verifyResponse.success && verifyResponse.correct) {
      // 授予临时通行证
      const duration = parseInt(prompt('授予访问时长（分钟）：', '10'));
      
      if (duration > 0) {
        const grantResponse = await chrome.runtime.sendMessage({
          action: 'grantTempPass',
          data: { domain: blockedDomain, duration: duration }
        });
        
        if (grantResponse.success) {
          alert(grantResponse.message);
          window.location.href = blockedUrl;
        }
      }
    } else {
      errorMsg.textContent = '密码错误';
    }
  });
  
  // Enter键提交密码
  document.getElementById('passwordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('confirmPassword').click();
    }
  });
}

