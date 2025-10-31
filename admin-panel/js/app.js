// ============================================
// Guardian 管理后台 - 主应用
// ============================================

// 全局状态
let appState = null;
let extensionId = null;

// 页面模板
const pages = {
  dashboard: () => renderDashboard(),
  blacklist: () => renderBlacklist(),
  whitelist: () => renderWhitelist(),
  logs: () => renderLogs(),
  violations: () => renderViolations(),
  schedule: () => renderSchedule(),
  settings: () => renderSettings()
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await detectExtension();
  await loadState();
  setupNavigation();
  setupRefresh();
  renderPage('dashboard');
});

// 检测浏览器插件
async function detectExtension() {
  // 尝试通过Chrome API连接
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      // 获取所有已安装的扩展
      const extensions = await chrome.management.getAll();
      const guardian = extensions.find(ext => ext.name.includes('Guardian'));
      
      if (guardian) {
        extensionId = guardian.id;
        console.log('✅ 检测到Guardian扩展:', extensionId);
      } else {
        showWarning('未检测到Guardian扩展，请先安装浏览器插件');
      }
    } catch (e) {
      console.log('⚠️ 无法访问Chrome API，使用模拟数据');
      useMockData();
    }
  } else {
    console.log('⚠️ 不在扩展环境中，使用模拟数据');
    useMockData();
  }
}

// 使用模拟数据（用于独立运行时）
function useMockData() {
  appState = {
    enabled: true,
    mode: 'blacklist',
    blacklist: ['bilibili.com', 'douyin.com', 'game.com'],
    whitelist: ['baidu.com', 'wikipedia.org'],
    stats: {
      todayBlocked: 15,
      totalBlocked: 128,
      todayAllowed: 45
    },
    dailyLimit: {
      enabled: true,
      maxMinutes: 120,
      usedMinutes: 35
    },
    accessLogs: [
      {url: 'https://www.bilibili.com', domain: 'bilibili.com', timestamp: Date.now() - 3600000, allowed: false},
      {url: 'https://www.baidu.com', domain: 'baidu.com', timestamp: Date.now() - 1800000, allowed: true}
    ]
  };
}

// 从插件加载状态
async function loadState() {
  if (extensionId) {
    try {
      // 向插件发送消息
      const response = await sendMessageToExtension({ action: 'getState' });
      if (response.success) {
        appState = response.state;
      }
    } catch (e) {
      console.error('加载状态失败:', e);
      useMockData();
    }
  } else if (!appState) {
    useMockData();
  }
}

// 向插件发送消息
async function sendMessageToExtension(message) {
  return new Promise((resolve) => {
    if (!extensionId || !chrome.runtime) {
      // 模拟响应
      setTimeout(() => resolve({success: true, ...message}), 100);
      return;
    }
    
    chrome.runtime.sendMessage(extensionId, message, (response) => {
      resolve(response || {success: false, error: '无响应'});
    });
  });
}

// 设置导航
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 更新激活状态
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // 渲染页面
      const page = item.dataset.page;
      renderPage(page);
    });
  });
}

// 设置刷新按钮
function setupRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadState();
    const activePage = document.querySelector('.nav-item.active').dataset.page;
    renderPage(activePage);
    showToast('数据已刷新', 'success');
  });
}

// 渲染页面
function renderPage(pageName) {
  const container = document.getElementById('pageContainer');
  const pageContent = pages[pageName]();
  container.innerHTML = pageContent;
  
  // 设置页面特定的事件监听器
  setupPageEvents(pageName);
}

// ========================================
// 页面渲染函数
// ========================================

// 仪表盘
function renderDashboard() {
  if (!appState) return '<p>加载中...</p>';
  
  return `
    <div class="page-header">
      <h2>📊 仪表盘</h2>
      <p>总览您的浏览保护状态</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">🛡️</div>
        <div class="stat-info">
          <h3>${appState.enabled ? '已启用' : '未启用'}</h3>
          <p>保护状态</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon red">🚫</div>
        <div class="stat-info">
          <h3>${appState.stats.todayBlocked}</h3>
          <p>今日拦截</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <h3>${appState.stats.todayAllowed}</h3>
          <p>今日访问</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon orange">⏱️</div>
        <div class="stat-info">
          <h3>${appState.dailyLimit.usedMinutes}分钟</h3>
          <p>已用时长</p>
        </div>
      </div>
    </div>
    
    <!-- 快速开关 -->
    <div class="card">
      <div class="card-title">快速控制</div>
      <div class="switch-container">
        <span>启用保护</span>
        <label class="switch">
          <input type="checkbox" id="enableToggle" ${appState.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      
      <div class="switch-container">
        <span>保护模式</span>
        <select class="form-select" id="modeSelect" style="width: auto;">
          <option value="blacklist" ${appState.mode === 'blacklist' ? 'selected' : ''}>黑名单模式</option>
          <option value="whitelist" ${appState.mode === 'whitelist' ? 'selected' : ''}>白名单模式</option>
        </select>
      </div>
    </div>
    
    <!-- 最近拦截 -->
    <div class="card">
      <div class="card-title">
        <span>最近拦截</span>
        <a href="#" class="btn btn-small btn-outline" onclick="renderPage('logs'); return false;">查看全部</a>
      </div>
      <div class="log-list">
        ${renderRecentLogs()}
      </div>
    </div>
  `;
}

// 黑名单页面
function renderBlacklist() {
  return `
    <div class="page-header">
      <h2>🚫 黑名单管理</h2>
      <p>管理不允许访问的网站</p>
    </div>
    
    <div class="card">
      <div class="add-domain-form">
        <input type="text" id="newBlackDomain" class="form-input" placeholder="输入域名，如：bilibili.com">
        <button class="btn btn-danger" onclick="addToBlacklist()">添加到黑名单</button>
      </div>
      
      <div class="domain-list">
        ${appState && appState.blacklist.length > 0 ? 
          appState.blacklist.map(domain => `
            <div class="domain-item">
              <span class="domain-name">${domain}</span>
              <button class="btn btn-small btn-danger" onclick="removeFromBlacklist('${domain}')">删除</button>
            </div>
          `).join('') : 
          '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>暂无黑名单</h3><p>添加您想要拦截的网站域名</p></div>'
        }
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">常用网站快速添加</div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-small btn-secondary" onclick="quickAddBlacklist('bilibili.com')">B站</button>
        <button class="btn btn-small btn-secondary" onclick="quickAddBlacklist('douyin.com')">抖音</button>
        <button class="btn btn-small btn-secondary" onclick="quickAddBlacklist('game.com')">游戏网站</button>
        <button class="btn btn-small btn-secondary" onclick="quickAddBlacklist('taobao.com')">淘宝</button>
        <button class="btn btn-small btn-secondary" onclick="quickAddBlacklist('jd.com')">京东</button>
      </div>
    </div>
  `;
}

// 白名单页面
function renderWhitelist() {
  return `
    <div class="page-header">
      <h2>✅ 白名单管理</h2>
      <p>管理允许访问的网站</p>
    </div>
    
    <div class="card">
      <div class="add-domain-form">
        <input type="text" id="newWhiteDomain" class="form-input" placeholder="输入域名，如：baidu.com">
        <button class="btn btn-success" onclick="addToWhitelist()">添加到白名单</button>
      </div>
      
      <div class="domain-list">
        ${appState && appState.whitelist.length > 0 ? 
          appState.whitelist.map(domain => `
            <div class="domain-item">
              <span class="domain-name">${domain}</span>
              <button class="btn btn-small btn-danger" onclick="removeFromWhitelist('${domain}')">删除</button>
            </div>
          `).join('') : 
          '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>暂无白名单</h3><p>添加您允许访问的网站域名</p></div>'
        }
      </div>
    </div>
  `;
}

// 访问日志页面
function renderLogs() {
  return `
    <div class="page-header">
      <h2>📝 访问日志</h2>
      <p>查看所有访问记录</p>
    </div>
    
    <div class="card">
      <div class="card-title">
        <span>访问历史</span>
        <div>
          <button class="btn btn-small btn-secondary" onclick="exportLogs()">导出日志</button>
          <button class="btn btn-small btn-danger" onclick="clearLogs()">清空日志</button>
        </div>
      </div>
      
      <div class="log-list" style="max-height: 600px; overflow-y: auto;">
        ${renderAllLogs()}
      </div>
    </div>
  `;
}

// 违规记录页面
function renderViolations() {
  return `
    <div class="page-header">
      <h2>⚠️ 违规操作记录</h2>
      <p>记录所有试图绕过保护的操作</p>
    </div>
    
    <div class="card">
      <div class="card-title">
        <span>违规操作历史</span>
        <div>
          <button class="btn btn-small btn-secondary" onclick="exportViolations()">导出记录</button>
          <button class="btn btn-small btn-danger" onclick="clearViolations()">清空记录</button>
        </div>
      </div>
      
      <div class="violation-list" style="max-height: 600px; overflow-y: auto;">
        ${renderAllViolations()}
      </div>
    </div>
    
    <div class="card">
      <h3>🔍 违规操作类型说明</h3>
      <table>
        <thead>
          <tr>
            <th>操作类型</th>
            <th>说明</th>
            <th>严重程度</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>protection_disabled</td>
            <td>主动关闭保护开关</td>
            <td><span class="badge badge-danger">高</span></td>
          </tr>
          <tr>
            <td>plugin_disabled</td>
            <td>在扩展管理页面禁用插件</td>
            <td><span class="badge badge-danger">高</span></td>
          </tr>
          <tr>
            <td>plugin_uninstalled</td>
            <td>卸载插件</td>
            <td><span class="badge badge-danger">高</span></td>
          </tr>
          <tr>
            <td>temp_pass_granted</td>
            <td>申请临时通行证</td>
            <td><span class="badge badge-warning">中</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// 渲染所有违规记录
function renderAllViolations() {
  if (!appState || !appState.violationLogs || appState.violationLogs.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>暂无违规记录</h3><p>太好了，用户表现良好！</p></div>';
  }
  
  return appState.violationLogs.slice().reverse().map(log => {
    const severityClass = getSeverityClass(log.action);
    const severityText = getSeverityText(log.action);
    
    return `
      <div class="violation-item ${severityClass}">
        <div class="violation-header">
          <span class="violation-user">👤 ${log.username || '未绑定用户'} (ID: ${log.userId || 'N/A'})</span>
          <span class="badge ${severityClass === 'high' ? 'badge-danger' : 'badge-warning'}">${severityText}</span>
        </div>
        <div class="violation-action">
          <strong>操作：</strong>${log.description}
        </div>
        <div class="violation-time">
          <strong>时间：</strong>${log.timestampStr || new Date(log.timestamp).toLocaleString('zh-CN')}
        </div>
      </div>
    `;
  }).join('');
}

function getSeverityClass(action) {
  const highSeverity = ['plugin_disabled', 'plugin_uninstalled', 'protection_disabled'];
  return highSeverity.includes(action) ? 'high' : 'medium';
}

function getSeverityText(action) {
  const highSeverity = ['plugin_disabled', 'plugin_uninstalled', 'protection_disabled'];
  return highSeverity.includes(action) ? '高危' : '警告';
}

// 时间管理页面
function renderSchedule() {
  return `
    <div class="page-header">
      <h2>⏰ 时间管理</h2>
      <p>设置上网时间限制</p>
    </div>
    
    <div class="card">
      <div class="card-title">每日时长限制</div>
      <div class="switch-container">
        <span>启用每日时长限制</span>
        <label class="switch">
          <input type="checkbox" id="dailyLimitToggle" ${appState.dailyLimit.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      
      <div class="form-group">
        <label class="form-label">每日最多上网时长（分钟）</label>
        <input type="number" id="maxMinutes" class="form-input" value="${appState.dailyLimit.maxMinutes}" min="0" max="1440">
      </div>
      
      <button class="btn btn-primary" onclick="saveDailyLimit()">保存设置</button>
    </div>
    
    <div class="card">
      <div class="card-title">时间段控制</div>
      <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 16px;">设置允许上网的时间段（功能开发中）</p>
      <div class="switch-container">
        <span>启用时间段控制</span>
        <label class="switch">
          <input type="checkbox" disabled>
          <span class="slider"></span>
        </label>
      </div>
    </div>
  `;
}

// 设置页面
function renderSettings() {
  return `
    <div class="page-header">
      <h2>⚙️ 系统设置</h2>
      <p>管理插件的基本设置</p>
    </div>
    
    <div class="card">
      <div class="card-title">管理员密码</div>
      <div class="form-group">
        <label class="form-label">设置管理员密码（用于临时通行证）</label>
        <input type="password" id="newPassword" class="form-input" placeholder="输入新密码">
      </div>
      <div class="form-group">
        <input type="password" id="confirmPassword" class="form-input" placeholder="确认新密码">
      </div>
      <button class="btn btn-primary" onclick="savePassword()">保存密码</button>
    </div>
    
    <div class="card">
      <div class="card-title">关于</div>
      <p><strong>Guardian 浏览器保护插件</strong></p>
      <p>版本：v1.0.0</p>
      <p>一个独立的浏览器保护解决方案</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-secondary btn-small" onclick="window.open('https://github.com/guardian-extension', '_blank')">GitHub</button>
        <button class="btn btn-secondary btn-small" onclick="window.open('https://docs.guardian.com', '_blank')">文档</button>
      </div>
    </div>
  `;
}

// 渲染最近日志
function renderRecentLogs() {
  if (!appState || !appState.accessLogs || appState.accessLogs.length === 0) {
    return '<div class="empty-state"><p>暂无访问记录</p></div>';
  }
  
  return appState.accessLogs.slice(-10).reverse().map(log => {
    const time = new Date(log.timestamp).toLocaleString('zh-CN');
    return `
      <div class="log-item ${log.allowed ? 'allowed' : 'blocked'}">
        <div class="log-time">${time}</div>
        <div class="log-url">${log.domain}</div>
      </div>
    `;
  }).join('');
}

// 渲染所有日志
function renderAllLogs() {
  if (!appState || !appState.accessLogs || appState.accessLogs.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>暂无日志</h3></div>';
  }
  
  return appState.accessLogs.slice().reverse().map(log => {
    const time = new Date(log.timestamp).toLocaleString('zh-CN');
    return `
      <div class="log-item ${log.allowed ? 'allowed' : 'blocked'}">
        <div class="log-time">${time}</div>
        <div class="log-url">${log.url}</div>
        <span class="badge ${log.allowed ? 'badge-success' : 'badge-danger'}">
          ${log.allowed ? '允许' : '拦截'}
        </span>
      </div>
    `;
  }).join('');
}

// ========================================
// 事件处理函数（全局作用域，供HTML调用）
// ========================================

// 添加到黑名单
async function addToBlacklist() {
  const input = document.getElementById('newBlackDomain');
  const domain = input.value.trim();
  
  if (!domain) {
    showToast('请输入域名', 'error');
    return;
  }
  
  if (appState.blacklist.includes(domain)) {
    showToast('该域名已在黑名单中', 'error');
    return;
  }
  
  appState.blacklist.push(domain);
  await updateConfig();
  input.value = '';
  renderPage('blacklist');
  showToast('已添加到黑名单', 'success');
}

// 从黑名单移除
async function removeFromBlacklist(domain) {
  appState.blacklist = appState.blacklist.filter(d => d !== domain);
  await updateConfig();
  renderPage('blacklist');
  showToast('已从黑名单移除', 'success');
}

// 快速添加到黑名单
async function quickAddBlacklist(domain) {
  if (appState.blacklist.includes(domain)) {
    showToast('该域名已在黑名单中', 'error');
    return;
  }
  
  appState.blacklist.push(domain);
  await updateConfig();
  renderPage('blacklist');
  showToast(`已添加 ${domain} 到黑名单`, 'success');
}

// 添加到白名单
async function addToWhitelist() {
  const input = document.getElementById('newWhiteDomain');
  const domain = input.value.trim();
  
  if (!domain) {
    showToast('请输入域名', 'error');
    return;
  }
  
  if (appState.whitelist.includes(domain)) {
    showToast('该域名已在白名单中', 'error');
    return;
  }
  
  appState.whitelist.push(domain);
  await updateConfig();
  input.value = '';
  renderPage('whitelist');
  showToast('已添加到白名单', 'success');
}

// 从白名单移除
async function removeFromWhitelist(domain) {
  appState.whitelist = appState.whitelist.filter(d => d !== domain);
  await updateConfig();
  renderPage('whitelist');
  showToast('已从白名单移除', 'success');
}

// 保存每日限制
async function saveDailyLimit() {
  const enabled = document.getElementById('dailyLimitToggle').checked;
  const maxMinutes = parseInt(document.getElementById('maxMinutes').value);
  
  appState.dailyLimit.enabled = enabled;
  appState.dailyLimit.maxMinutes = maxMinutes;
  
  await updateConfig();
  showToast('设置已保存', 'success');
}

// 保存密码
async function savePassword() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!newPassword) {
    showToast('请输入密码', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('两次密码不一致', 'error');
    return;
  }
  
  const response = await sendMessageToExtension({
    action: 'setPassword',
    data: { password: newPassword }
  });
  
  if (response.success) {
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    showToast('密码已设置', 'success');
  }
}

// 导出日志
function exportLogs() {
  if (!appState || !appState.accessLogs || appState.accessLogs.length === 0) {
    showToast('暂无日志可导出', 'error');
    return;
  }
  
  const csv = 'timestamp,domain,url,allowed\n' + 
    appState.accessLogs.map(log => 
      `${new Date(log.timestamp).toISOString()},${log.domain},${log.url},${log.allowed}`
    ).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guardian-logs-${Date.now()}.csv`;
  a.click();
  
  showToast('日志已导出', 'success');
}

// 清空日志
async function clearLogs() {
  if (!confirm('确定要清空所有日志吗？此操作不可恢复。')) {
    return;
  }
  
  const response = await sendMessageToExtension({ action: 'clearLogs' });
  
  if (response.success) {
    appState.accessLogs = [];
    renderPage('logs');
    showToast('日志已清空', 'success');
  }
}

// 导出违规记录
async function exportViolations() {
  if (!appState || !appState.violationLogs || appState.violationLogs.length === 0) {
    showToast('暂无违规记录可导出', 'error');
    return;
  }
  
  const csv = '时间,用户ID,用户名,操作类型,描述\n' + 
    appState.violationLogs.map(log => 
      `${log.timestampStr || new Date(log.timestamp).toLocaleString('zh-CN')},${log.userId},${log.username},${log.action},${log.description}`
    ).join('\n');
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // 添加BOM以支持中文
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guardian-violations-${Date.now()}.csv`;
  a.click();
  
  showToast('违规记录已导出', 'success');
}

// 清空违规记录
async function clearViolations() {
  if (!confirm('确定要清空所有违规记录吗？此操作不可恢复。')) {
    return;
  }
  
  const response = await sendMessageToExtension({ action: 'clearViolations' });
  
  if (response.success) {
    appState.violationLogs = [];
    renderPage('violations');
    showToast('违规记录已清空', 'success');
  }
}

// 更新配置
async function updateConfig() {
  const response = await sendMessageToExtension({
    action: 'updateConfig',
    data: appState
  });
  
  if (!response.success) {
    showToast('保存失败', 'error');
  }
}

// 设置页面特定事件
function setupPageEvents(pageName) {
  if (pageName === 'dashboard') {
    // 启用开关
    const enableToggle = document.getElementById('enableToggle');
    if (enableToggle) {
      enableToggle.addEventListener('change', async (e) => {
        appState.enabled = e.target.checked;
        await updateConfig();
        showToast(appState.enabled ? '保护已启用' : '保护已禁用', 'success');
      });
    }
    
    // 模式选择
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
      modeSelect.addEventListener('change', async (e) => {
        appState.mode = e.target.value;
        await updateConfig();
        showToast('模式已切换', 'success');
      });
    }
  }
}

// 显示提示
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// 显示警告
function showWarning(message) {
  const warning = document.createElement('div');
  warning.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff3cd;
    color: #856404;
    padding: 16px 24px;
    border-radius: 8px;
    border-left: 4px solid #ffc107;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
  `;
  warning.textContent = message;
  document.body.appendChild(warning);
}

// 暴露全局函数
window.renderPage = renderPage;
window.addToBlacklist = addToBlacklist;
window.removeFromBlacklist = removeFromBlacklist;
window.quickAddBlacklist = quickAddBlacklist;
window.addToWhitelist = addToWhitelist;
window.removeFromWhitelist = removeFromWhitelist;
window.saveDailyLimit = saveDailyLimit;
window.savePassword = savePassword;
window.exportLogs = exportLogs;
window.clearLogs = clearLogs;
window.exportViolations = exportViolations;
window.clearViolations = clearViolations;

console.log('✅ Guardian 管理后台已启动');

