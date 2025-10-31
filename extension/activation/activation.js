// Guardian 激活页面

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkExistingActivation();
});

// 设置事件监听
function setupEventListeners() {
  const activateBtn = document.getElementById('activateBtn');
  const licenseInput = document.getElementById('licenseKey');
  const usernameInput = document.getElementById('username');
  
  // 激活按钮
  activateBtn.addEventListener('click', async () => {
    await activateLicense();
  });
  
  // 回车激活
  licenseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      activateBtn.click();
    }
  });
  
  // 自动格式化输入（添加连字符）
  licenseInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/-/g, '').toUpperCase();
    if (value.length > 0) {
      const formatted = value.match(/.{1,5}/g)?.join('-') || value;
      e.target.value = formatted.substring(0, 29);
    }
  });
}

// 检查是否已激活
async function checkExistingActivation() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkActivation'
    });
    
    if (response && response.activated) {
      // 已激活，显示成功信息并跳转
      showSuccess('您已激活，即将跳转...');
      setTimeout(() => {
        window.close();
      }, 1500);
    }
  } catch (error) {
    console.error('检查激活状态失败:', error);
  }
}

// 激活许可证
async function activateLicense() {
  const licenseKey = document.getElementById('licenseKey').value.trim();
  const username = document.getElementById('username').value.trim();
  const activateBtn = document.getElementById('activateBtn');
  
  // 验证输入
  if (!licenseKey) {
    showError('请输入激活码');
    return;
  }
  
  // 验证格式
  const keyPattern = /^GUARD-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/;
  if (!keyPattern.test(licenseKey)) {
    showError('激活码格式错误，正确格式：GUARD-XXXX-XXXX-XXXX-XXXX');
    return;
  }
  
  // 显示加载状态
  activateBtn.disabled = true;
  activateBtn.querySelector('.btn-text').style.display = 'none';
  activateBtn.querySelector('.btn-loading').style.display = 'inline';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'activateLicense',
      data: {
        licenseKey: licenseKey,
        username: username || '未知用户'
      }
    });
    
    if (response && response.success) {
      showSuccess('✅ 激活成功！Guardian已启用');
      
      // 2秒后关闭页面
      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 2000);
    } else {
      showError(response.error || '激活失败，请检查激活码');
      resetButton(activateBtn);
    }
  } catch (error) {
    showError('激活失败：' + error.message);
    resetButton(activateBtn);
  }
}

// 复制演示激活码
function copyDemoKey(key) {
  document.getElementById('licenseKey').value = key;
  document.getElementById('licenseKey').focus();
  
  // 显示提示
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '已复制';
  btn.style.background = '#27ae60';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '#667eea';
  }, 1500);
}

// 显示错误
function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  const successEl = document.getElementById('successMessage');
  
  successEl.classList.remove('show');
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

// 显示成功
function showSuccess(message) {
  const errorEl = document.getElementById('errorMessage');
  const successEl = document.getElementById('successMessage');
  
  errorEl.classList.remove('show');
  successEl.textContent = message;
  successEl.classList.add('show');
}

// 重置按钮状态
function resetButton(btn) {
  btn.disabled = false;
  btn.querySelector('.btn-text').style.display = 'inline';
  btn.querySelector('.btn-loading').style.display = 'none';
}

// 暴露全局函数
window.copyDemoKey = copyDemoKey;

