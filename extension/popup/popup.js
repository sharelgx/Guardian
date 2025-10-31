// ============================================
// Guardian 浏览器保护插件 - 弹窗界面
// ============================================

let currentTab = null;
let currentDomain = null;
let appState = null;

// 页面加载
document.addEventListener('DOMContentLoaded', async () => {
  await checkActivation();
  await loadCurrentTab();
  await loadState();
  setupEventListeners();
  updateUI();
  
  // 每秒更新一次
  setInterval(loadState, 1000);
});

// 检查激活状态
async function checkActivation() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkActivation'
    });
    
    if (response && !response.activated) {
      // 未激活，跳转到激活页面
      chrome.tabs.create({
        url: chrome.runtime.getURL('activation/activation.html')
      });
      window.close();
    }
  } catch (error) {
    console.error('检查激活状态失败:', error);
  }
}

// 加载当前标签页
async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
  if (tab && tab.url) {
    try {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
    } catch (e) {
      currentDomain = null;
    }
  }
}

// 加载状态
async function loadState() {
  const response = await chrome.runtime.sendMessage({ action: 'getState' });
  if (response.success) {
    appState = response.state;
    updateUI();
  }
}

// 更新界面
function updateUI() {
  if (!appState) return;
  
  // 更新状态指示器
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const enableToggle = document.getElementById('enableToggle');
  
  if (appState.enabled) {
    statusDot.classList.add('active');
    statusText.textContent = '已启用';
    enableToggle.checked = true;
  } else {
    statusDot.classList.remove('active');
    statusText.textContent = '未启用';
    enableToggle.checked = false;
  }
  
  // 更新统计
  document.getElementById('todayBlocked').textContent = appState.stats.todayBlocked;
  document.getElementById('todayAllowed').textContent = appState.stats.todayAllowed;
  document.getElementById('usedTime').textContent = `${appState.dailyLimit.usedMinutes}分钟`;
  
  // 更新当前网站
  const siteDomain = document.getElementById('siteDomain');
  const siteStatus = document.getElementById('siteStatus');
  const quickBlock = document.getElementById('quickBlock');
  const quickAllow = document.getElementById('quickAllow');
  
  if (currentDomain) {
    siteDomain.textContent = currentDomain;
    
    // 判断当前网站状态
    const inBlacklist = appState.blacklist.includes(currentDomain);
    const inWhitelist = appState.whitelist.includes(currentDomain);
    
    if (appState.mode === 'blacklist') {
      if (inBlacklist) {
        siteStatus.innerHTML = '<span class="badge badge-danger">已拦截</span>';
        quickBlock.innerHTML = '<span>✅</span> 从黑名单移除';
        quickBlock.disabled = false;
      } else {
        siteStatus.innerHTML = '<span class="badge badge-success">允许访问</span>';
        quickBlock.innerHTML = '<span>🚫</span> 加入黑名单';
        quickBlock.disabled = false;
      }
    } else {
      if (inWhitelist) {
        siteStatus.innerHTML = '<span class="badge badge-success">允许访问</span>';
        quickAllow.innerHTML = '<span>🚫</span> 从白名单移除';
        quickAllow.disabled = false;
      } else {
        siteStatus.innerHTML = '<span class="badge badge-danger">已拦截</span>';
        quickAllow.innerHTML = '<span>✅</span> 加入白名单';
        quickAllow.disabled = false;
      }
    }
  } else {
    siteDomain.textContent = '无法获取域名';
    siteStatus.innerHTML = '';
    quickBlock.disabled = true;
    quickAllow.disabled = true;
  }
  
  // 显示/隐藏临时通行证
  const tempPassSection = document.getElementById('tempPassSection');
  const tempPassInfo = document.getElementById('tempPassInfo');
  
  if (appState.tempPass.active) {
    const remaining = Math.ceil((appState.tempPass.expiresAt - Date.now()) / 60000);
    tempPassInfo.textContent = `临时通行证: ${appState.tempPass.domain} (${remaining}分钟)`;
    tempPassSection.style.display = 'block';
  } else {
    tempPassSection.style.display = 'none';
  }
}

// 设置事件监听
function setupEventListeners() {
  // 启用开关
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    const response = await chrome.runtime.sendMessage({
      action: 'toggleEnabled'
    });
    if (response.success) {
      await loadState();
    }
  });
  
  // 快速拉黑
  document.getElementById('quickBlock').addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!currentDomain) {
      showToast('无法获取当前网站域名', 'error');
      return;
    }
    
    console.log('点击加入黑名单，当前域名:', currentDomain);
    
    const inBlacklist = appState.blacklist.includes(currentDomain);
    const action = inBlacklist ? 'removeFromBlacklist' : 'addToBlacklist';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: action,
        data: { domain: currentDomain }
      });
      
      console.log('后台响应:', response);
      
      if (response && response.success) {
        await loadState();
        showToast(inBlacklist ? '✅ 已从黑名单移除' : '✅ 已加入黑名单', 'success');
      } else {
        showToast('操作失败，请重试', 'error');
      }
    } catch (error) {
      console.error('操作错误:', error);
      showToast('操作失败: ' + error.message, 'error');
    }
  });
  
  // 快速放行
  document.getElementById('quickAllow').addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!currentDomain) {
      showToast('无法获取当前网站域名', 'error');
      return;
    }
    
    console.log('点击加入白名单，当前域名:', currentDomain);
    
    const inWhitelist = appState.whitelist.includes(currentDomain);
    const action = inWhitelist ? 'removeFromWhitelist' : 'addToWhitelist';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: action,
        data: { domain: currentDomain }
      });
      
      console.log('后台响应:', response);
      
      if (response && response.success) {
        await loadState();
        showToast(inWhitelist ? '✅ 已从白名单移除' : '✅ 已加入白名单', 'success');
      } else {
        showToast('操作失败，请重试', 'error');
      }
    } catch (error) {
      console.error('操作错误:', error);
      showToast('操作失败: ' + error.message, 'error');
    }
  });
  
  // 打开管理后台
  document.getElementById('openAdmin').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:8888' });
  });
  
  // 打开设置
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// 显示提示
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  
  const bgColor = type === 'error' ? '#e74c3c' : '#27ae60';
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bgColor};
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
  
  // 同时在控制台输出
  console.log(`[Toast] ${message}`);
}

