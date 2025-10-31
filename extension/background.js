// ============================================
// Guardian 浏览器保护插件 - 后台服务
// ============================================

// ============ 全局配置 ============
const CONFIG = {
  VERSION: '1.0.0',
  STORAGE_KEY: 'guardian_config',
  LOGS_KEY: 'guardian_logs',
  STATS_KEY: 'guardian_stats',
  ADMIN_URL: 'http://localhost:8888', // 管理后台地址
  MAX_LOGS: 1000 // 最大日志条数
};

// ============ 全局状态 ============
let appState = {
  // 保护模式
  enabled: false,
  mode: 'blacklist', // 'blacklist' | 'whitelist'
  
  // 名单配置
  blacklist: [],
  whitelist: [],
  
  // 时间管理
  timeControl: {
    enabled: false,
    schedules: [] // [{days: [1,2,3], startTime: '08:00', endTime: '22:00'}]
  },
  
  // 时长限制
  dailyLimit: {
    enabled: false,
    maxMinutes: 120, // 每日最多2小时
    usedMinutes: 0,
    lastResetDate: null
  },
  
  // 临时通行证
  tempPass: {
    active: false,
    domain: null,
    expiresAt: null
  },
  
  // 统计数据
  stats: {
    todayBlocked: 0,
    totalBlocked: 0,
    todayAllowed: 0,
    lastResetDate: null
  },
  
  // 访问日志（内存缓存）
  accessLogs: [],
  
  // ============ 新增：违规操作日志 ============
  violationLogs: [],
  
  // 用户信息（用于记录是谁操作的）
  userInfo: {
    userId: null,
    username: null,
    bindTime: null
  },
  
  // ============ 新增：课堂模式 ============
  classroomMode: {
    enabled: false,              // 是否启用课堂模式
    sessionId: null,             // 课堂会话ID
    serverUrl: null,             // MetaSeekOJ服务器地址
    reportInterval: 5000,        // 上报间隔（毫秒）
    allowedDomains: [],          // 课堂允许的域名
    reportQueue: []              // 待上报的访问记录
  },
  
  // 管理员密码
  password: null,
  
  // 是否首次安装
  firstInstall: true
};

// ============ 初始化 ============
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Guardian 插件已安装:', details);
  
  if (details.reason === 'install') {
    // 首次安装
    await initializeExtension();
    
    // 记录安装事件
    await logViolation('plugin_installed', '插件首次安装');
    
    // 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html?welcome=true')
    });
  } else if (details.reason === 'update') {
    console.log('插件已更新到版本', CONFIG.VERSION);
    await loadConfiguration();
  }
});

// ============ 监听插件被禁用/卸载 ============
chrome.management.onDisabled.addListener(async (info) => {
  if (info.id === chrome.runtime.id) {
    // 插件被禁用
    await logViolation('plugin_disabled', '插件被禁用');
    
    // 尝试发送警报（如果配置了服务器）
    await sendViolationAlert('插件被禁用');
  }
});

chrome.management.onUninstalled.addListener(async (id) => {
  if (id === chrome.runtime.id) {
    // 插件被卸载（这个事件可能无法触发，因为插件已被卸载）
    // 我们在卸载前会尝试记录
    await logViolation('plugin_uninstalled', '插件被卸载');
    await sendViolationAlert('插件被卸载');
  }
});

// 监听插件挂起前（卸载前的最后机会）
chrome.runtime.onSuspend.addListener(async () => {
  console.log('Guardian 即将被卸载或禁用');
  await logViolation('plugin_suspending', '插件即将停止');
  
  // 立即上传所有日志
  await uploadAllLogs();
});

// 启动时加载配置
chrome.runtime.onStartup.addListener(async () => {
  await loadConfiguration();
});

async function initializeExtension() {
  // 设置默认配置
  const defaultConfig = {
    enabled: false,
    mode: 'blacklist',
    blacklist: [],
    whitelist: [],
    timeControl: { enabled: false, schedules: [] },
    dailyLimit: { enabled: false, maxMinutes: 120, usedMinutes: 0, lastResetDate: getTodayDate() },
    tempPass: { active: false, domain: null, expiresAt: null },
    stats: { todayBlocked: 0, totalBlocked: 0, todayAllowed: 0, lastResetDate: getTodayDate() },
    password: null,
    firstInstall: true
  };
  
  await chrome.storage.local.set({ [CONFIG.STORAGE_KEY]: defaultConfig });
  appState = { ...defaultConfig, accessLogs: [] };
  
  console.log('✅ Guardian 初始化完成');
}

async function loadConfiguration() {
  const data = await chrome.storage.local.get([CONFIG.STORAGE_KEY, CONFIG.LOGS_KEY, CONFIG.STATS_KEY, 'violationLogs']);
  
  if (data[CONFIG.STORAGE_KEY]) {
    appState = { ...appState, ...data[CONFIG.STORAGE_KEY] };
  }
  
  if (data[CONFIG.LOGS_KEY]) {
    appState.accessLogs = data[CONFIG.LOGS_KEY];
  }
  
  if (data.violationLogs) {
    appState.violationLogs = data.violationLogs;
  }
  
  // 重置每日统计（如果是新的一天）
  if (appState.stats.lastResetDate !== getTodayDate()) {
    appState.stats.todayBlocked = 0;
    appState.stats.todayAllowed = 0;
    appState.stats.lastResetDate = getTodayDate();
    appState.dailyLimit.usedMinutes = 0;
    appState.dailyLimit.lastResetDate = getTodayDate();
    await saveConfiguration();
  }
  
  console.log('✅ 配置已加载:', appState);
  
  // 更新图标状态
  updateIcon();
  
  // 记录插件启动
  await logViolation('plugin_started', '插件后台服务启动');
}

async function saveConfiguration() {
  const configToSave = { ...appState };
  delete configToSave.accessLogs; // 日志单独保存
  
  await chrome.storage.local.set({
    [CONFIG.STORAGE_KEY]: configToSave,
    [CONFIG.LOGS_KEY]: appState.accessLogs.slice(-CONFIG.MAX_LOGS) // 只保留最近1000条
  });
}

// ============ 网站拦截核心逻辑 ============
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // 只处理主框架
  if (details.frameId !== 0) return;
  
  // 如果保护未启用，放行
  if (!appState.enabled) return;
  
  const url = details.url;
  
  // 跳过特殊协议
  if (url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:') ||
      url.startsWith('edge://')) {
    return;
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // 检查是否应该拦截
    const shouldBlock = await checkIfBlocked(domain, url);
    
    if (shouldBlock) {
      // 拦截
      await handleBlocked(details.tabId, url, domain, shouldBlock.reason);
    } else {
      // 允许
      await handleAllowed(url, domain);
    }
  } catch (error) {
    console.error('处理导航错误:', error);
  }
});

async function checkIfBlocked(domain, url) {
  // 1. 检查临时通行证
  if (appState.tempPass.active && 
      appState.tempPass.domain === domain &&
      Date.now() < appState.tempPass.expiresAt) {
    return false; // 有效的临时通行证，放行
  }
  
  // 2. 检查时间管理
  if (appState.timeControl.enabled && !isInAllowedTimeRange()) {
    return { reason: '当前时间段不允许上网' };
  }
  
  // 3. 检查每日时长限制
  if (appState.dailyLimit.enabled && 
      appState.dailyLimit.usedMinutes >= appState.dailyLimit.maxMinutes) {
    return { reason: '今日上网时长已用完' };
  }
  
  // 4. 根据模式检查名单
  if (appState.mode === 'blacklist') {
    // 黑名单模式：默认允许，黑名单拦截
    if (isInList(domain, appState.blacklist)) {
      return { reason: '该网站在黑名单中' };
    }
  } else if (appState.mode === 'whitelist') {
    // 白名单模式：默认拦截，白名单允许
    if (!isInList(domain, appState.whitelist)) {
      return { reason: '该网站不在白名单中' };
    }
  }
  
  return false; // 不拦截
}

function isInList(domain, list) {
  return list.some(pattern => matchDomain(domain, pattern));
}

function matchDomain(domain, pattern) {
  // 精确匹配
  if (domain === pattern) return true;
  
  // 通配符匹配：*.example.com
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1); // .example.com
    return domain.endsWith(suffix) || domain === pattern.slice(2);
  }
  
  // 通配符匹配：example.*
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return domain.startsWith(prefix + '.');
  }
  
  return false;
}

function isInAllowedTimeRange() {
  const now = new Date();
  const currentDay = now.getDay(); // 0=周日
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const schedules = appState.timeControl.schedules;
  
  // 如果没有配置，默认不限制
  if (!schedules || schedules.length === 0) return true;
  
  for (const schedule of schedules) {
    if (schedule.days.includes(currentDay)) {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        return true;
      }
    }
  }
  
  return false;
}

async function handleBlocked(tabId, url, domain, reason) {
  // 更新统计
  appState.stats.todayBlocked++;
  appState.stats.totalBlocked++;
  
  // 记录日志
  await logAccess({
    url: url,
    domain: domain,
    timestamp: Date.now(),
    allowed: false,
    reason: reason
  });
  
  // 课堂模式：立即上报违规访问（学生切换到其他网站）
  if (appState.classroomMode.enabled) {
    await reportToClassroom({
      url: url,
      domain: domain,
      allowed: false,
      reason: reason,
      timestamp: Date.now()
    }, true); // true = 立即上报，不等待队列
  }
  
  // 保存配置
  await saveConfiguration();
  
  // 跳转到拦截页面
  const blockedUrl = chrome.runtime.getURL('blocked/blocked.html') +
    `?url=${encodeURIComponent(url)}` +
    `&reason=${encodeURIComponent(reason)}`;
  
  chrome.tabs.update(tabId, { url: blockedUrl });
  
  // 显示通知（可选）
  if (appState.stats.todayBlocked === 1) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Guardian 保护已激活',
      message: `已拦截访问: ${domain}`
    });
  }
}

async function handleAllowed(url, domain) {
  // 更新统计
  appState.stats.todayAllowed++;
  
  // 记录日志
  await logAccess({
    url: url,
    domain: domain,
    timestamp: Date.now(),
    allowed: true,
    reason: 'allowed'
  });
  
  // 课堂模式：上报访问
  if (appState.classroomMode.enabled) {
    await reportToClassroom({
      url: url,
      domain: domain,
      allowed: true,
      timestamp: Date.now()
    });
  }
}

async function logAccess(log) {
  appState.accessLogs.push(log);
  
  // 限制日志数量
  if (appState.accessLogs.length > CONFIG.MAX_LOGS) {
    appState.accessLogs = appState.accessLogs.slice(-CONFIG.MAX_LOGS);
  }
  
  // 定期保存（每10条）
  if (appState.accessLogs.length % 10 === 0) {
    await chrome.storage.local.set({
      [CONFIG.LOGS_KEY]: appState.accessLogs
    });
  }
}

// ============ 图标状态管理 ============
function updateIcon() {
  const title = appState.enabled ? 'Guardian 已启用 🔒' : 'Guardian 未启用';
  
  // 暂时不设置图标，避免文件不存在的错误
  // chrome.action.setIcon({ path: iconPath });
  chrome.action.setTitle({ title: title });
}

// ============ 消息监听 ============
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('处理消息错误:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  return true; // 异步响应
});

async function handleMessage(message, sender) {
  const { action, data } = message;
  
  switch (action) {
    case 'getState':
      return { success: true, state: appState };
    
    case 'updateConfig':
      Object.assign(appState, data);
      await saveConfiguration();
      updateIcon();
      return { success: true };
    
    case 'toggleEnabled':
      const wasEnabled = appState.enabled;
      appState.enabled = !appState.enabled;
      
      // 记录关闭保护的操作
      if (wasEnabled && !appState.enabled) {
        await logViolation('protection_disabled', '用户主动关闭保护');
      }
      
      await saveConfiguration();
      updateIcon();
      return { success: true, enabled: appState.enabled };
    
    case 'getLogs':
      const { limit = 100, offset = 0 } = data || {};
      const logs = appState.accessLogs.slice(-limit - offset, -offset || undefined);
      return { success: true, logs: logs.reverse() };
    
    case 'clearLogs':
      appState.accessLogs = [];
      await chrome.storage.local.set({ [CONFIG.LOGS_KEY]: [] });
      return { success: true };
    
    case 'grantTempPass':
      const { domain, duration = 10 } = data;
      appState.tempPass = {
        active: true,
        domain: domain,
        expiresAt: Date.now() + duration * 60 * 1000
      };
      await saveConfiguration();
      
      // 设置定时器自动取消
      setTimeout(async () => {
        if (appState.tempPass.domain === domain) {
          appState.tempPass.active = false;
          await saveConfiguration();
        }
      }, duration * 60 * 1000);
      
      return { success: true, message: `临时通行证已授予，${duration}分钟后失效` };
    
    case 'addToBlacklist':
      if (!appState.blacklist.includes(data.domain)) {
        appState.blacklist.push(data.domain);
        await saveConfiguration();
      }
      return { success: true };
    
    case 'removeFromBlacklist':
      appState.blacklist = appState.blacklist.filter(d => d !== data.domain);
      await saveConfiguration();
      return { success: true };
    
    case 'addToWhitelist':
      if (!appState.whitelist.includes(data.domain)) {
        appState.whitelist.push(data.domain);
        await saveConfiguration();
      }
      return { success: true };
    
    case 'removeFromWhitelist':
      appState.whitelist = appState.whitelist.filter(d => d !== data.domain);
      await saveConfiguration();
      return { success: true };
    
    case 'getStats':
      return {
        success: true,
        stats: {
          ...appState.stats,
          dailyLimit: appState.dailyLimit,
          tempPass: appState.tempPass
        }
      };
    
    case 'verifyPassword':
      const correct = appState.password === data.password;
      return { success: true, correct: correct };
    
    case 'setPassword':
      appState.password = data.password;
      await saveConfiguration();
      return { success: true };
    
    case 'bindUser':
      // 绑定用户信息
      appState.userInfo = {
        userId: data.userId,
        username: data.username,
        bindTime: Date.now()
      };
      await saveConfiguration();
      await logViolation('user_bound', `用户绑定: ${data.username}`);
      return { success: true };
    
    case 'getViolations':
      // 获取违规日志
      const violationLimit = data?.limit || 50;
      return {
        success: true,
        violations: appState.violationLogs.slice(-violationLimit).reverse()
      };
    
    case 'clearViolations':
      // 清空违规日志
      appState.violationLogs = [];
      await chrome.storage.local.set({ violationLogs: [] });
      return { success: true };
    
    case 'enableClassroomMode':
      // 启用课堂模式
      appState.classroomMode.enabled = true;
      appState.classroomMode.sessionId = data.sessionId;
      appState.classroomMode.serverUrl = data.serverUrl;
      appState.classroomMode.allowedDomains = data.allowedDomains || [];
      
      // 自动切换到白名单模式
      appState.enabled = true;
      appState.mode = 'whitelist';
      appState.whitelist = data.allowedDomains || [];
      
      await saveConfiguration();
      await logViolation('classroom_mode_enabled', `课堂模式已启用: Session ${data.sessionId}`);
      
      // 启动定时上报
      startClassroomReporting();
      
      return { success: true, message: '课堂模式已启用' };
    
    case 'disableClassroomMode':
      // 禁用课堂模式
      appState.classroomMode.enabled = false;
      
      // 上报剩余的队列
      await uploadClassroomReports();
      
      // 停止定时上报
      stopClassroomReporting();
      
      await saveConfiguration();
      await logViolation('classroom_mode_disabled', '课堂模式已禁用');
      
      return { success: true, message: '课堂模式已禁用' };
    
    default:
      return { success: false, error: '未知操作' };
  }
}

// ============ 定时任务 ============

// 每分钟检查一次
chrome.alarms.create('checkTimeLimit', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkTimeLimit') {
    // 检查临时通行证是否过期
    if (appState.tempPass.active && Date.now() > appState.tempPass.expiresAt) {
      appState.tempPass.active = false;
      await saveConfiguration();
    }
    
    // 增加已用时长（如果在限制时段）
    if (appState.dailyLimit.enabled && appState.enabled) {
      appState.dailyLimit.usedMinutes++;
      await saveConfiguration();
    }
    
    // 保存日志
    await chrome.storage.local.set({
      [CONFIG.LOGS_KEY]: appState.accessLogs
    });
  }
});

// ============ 违规操作监控 ============

// 记录违规操作
async function logViolation(action, description) {
  const violation = {
    userId: appState.userInfo.userId || 'unknown',
    username: appState.userInfo.username || '未绑定用户',
    action: action,
    description: description,
    timestamp: Date.now(),
    timestampStr: new Date().toLocaleString('zh-CN')
  };
  
  appState.violationLogs.push(violation);
  
  // 保存到storage
  await chrome.storage.local.set({
    violationLogs: appState.violationLogs.slice(-100) // 只保留最近100条
  });
  
  console.warn('⚠️ 违规操作记录:', violation);
  
  // 立即上传到服务器（如果配置了）
  await uploadViolationLog(violation);
  
  return violation;
}

// 上传违规日志到服务器
async function uploadViolationLog(violation) {
  // Service Worker中使用chrome.storage代替localStorage
  const data = await chrome.storage.local.get('guardian_server_url');
  const serverUrl = data.guardian_server_url;
  
  if (!serverUrl) {
    console.log('未配置服务器，违规日志仅保存在本地');
    return;
  }
  
  try {
    const response = await fetch(`${serverUrl}/api/guardian/violations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: violation.userId,
        username: violation.username,
        action: violation.action,
        description: violation.description,
        timestamp: violation.timestamp,
        browser_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ 违规日志已上传到服务器');
    }
  } catch (error) {
    console.error('上传违规日志失败:', error);
    // 失败也没关系，本地已记录
  }
}

// 发送违规警报（通知管理员）
async function sendViolationAlert(message) {
  const data = await chrome.storage.local.get('guardian_server_url');
  const serverUrl = data.guardian_server_url;
  
  if (!serverUrl) return;
  
  try {
    await fetch(`${serverUrl}/api/guardian/alert/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: appState.userInfo.userId,
        username: appState.userInfo.username,
        alert_type: 'violation',
        message: message,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('发送警报失败:', error);
  }
}

// 上传所有待上传的日志
async function uploadAllLogs() {
  console.log('正在上传所有日志...');
  
  // 上传访问日志
  if (appState.accessLogs.length > 0) {
    await uploadLogs();
  }
  
  // 上传违规日志
  for (const violation of appState.violationLogs) {
    await uploadViolationLog(violation);
  }
  
  console.log('✅ 所有日志已上传');
}

// ============ 课堂模式实时上报 ============

let classroomReportTimer = null;

// 上报到课堂系统
async function reportToClassroom(accessInfo, immediate = false) {
  if (!appState.classroomMode.enabled || !appState.classroomMode.serverUrl) {
    return;
  }
  
  // 构建上报数据
  const report = {
    session_id: appState.classroomMode.sessionId,
    student_id: appState.userInfo.userId,
    student_name: appState.userInfo.username,
    url: accessInfo.url,
    domain: accessInfo.domain,
    allowed: accessInfo.allowed,
    reason: accessInfo.reason || '',
    timestamp: accessInfo.timestamp,
    timestamp_str: new Date(accessInfo.timestamp).toLocaleString('zh-CN')
  };
  
  if (immediate) {
    // 立即上报（拦截事件）
    await sendClassroomReport([report]);
  } else {
    // 加入队列，批量上报（正常访问）
    appState.classroomMode.reportQueue.push(report);
  }
}

// 发送上报数据到课堂服务器
async function sendClassroomReport(reports) {
  if (!appState.classroomMode.serverUrl || reports.length === 0) {
    return;
  }
  
  try {
    const response = await fetch(
      `${appState.classroomMode.serverUrl}/api/classroom/guardian-reports/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reports: reports
        })
      }
    );
    
    if (response.ok) {
      console.log(`✅ 已上报 ${reports.length} 条访问记录到课堂系统`);
      
      // 如果是拦截事件，还要发送实时警报
      const blockedReports = reports.filter(r => !r.allowed);
      if (blockedReports.length > 0) {
        await sendClassroomAlert(blockedReports[0]);
      }
    } else {
      console.error('上报失败:', response.status);
    }
  } catch (error) {
    console.error('上报课堂系统失败:', error);
    // 失败了重新加入队列
    appState.classroomMode.reportQueue.unshift(...reports);
  }
}

// 发送实时警报（学生访问违规网站）
async function sendClassroomAlert(report) {
  if (!appState.classroomMode.serverUrl) return;
  
  try {
    await fetch(
      `${appState.classroomMode.serverUrl}/api/classroom/guardian-alert/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'blocked_access',
          session_id: appState.classroomMode.sessionId,
          student_id: report.student_id,
          student_name: report.student_name,
          domain: report.domain,
          url: report.url,
          timestamp: report.timestamp,
          message: `学生 ${report.student_name} 尝试访问被拦截的网站: ${report.domain}`
        })
      }
    );
    console.log('🚨 违规警报已发送');
  } catch (error) {
    console.error('发送警报失败:', error);
  }
}

// 启动定时上报
function startClassroomReporting() {
  if (classroomReportTimer) {
    clearInterval(classroomReportTimer);
  }
  
  classroomReportTimer = setInterval(async () => {
    await uploadClassroomReports();
  }, appState.classroomMode.reportInterval);
  
  console.log('✅ 课堂上报已启动，间隔:', appState.classroomMode.reportInterval, 'ms');
}

// 停止定时上报
function stopClassroomReporting() {
  if (classroomReportTimer) {
    clearInterval(classroomReportTimer);
    classroomReportTimer = null;
  }
  console.log('⏹️ 课堂上报已停止');
}

// 批量上传队列中的记录
async function uploadClassroomReports() {
  if (appState.classroomMode.reportQueue.length === 0) {
    return;
  }
  
  const reportsToSend = [...appState.classroomMode.reportQueue];
  appState.classroomMode.reportQueue = [];
  
  await sendClassroomReport(reportsToSend);
}

// ============ 工具函数 ============
function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ============ 导出配置（用于管理后台） ============
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'admin-panel') {
    port.onMessage.addListener(async (msg) => {
      const response = await handleMessage(msg, null);
      port.postMessage(response);
    });
  }
});

console.log('✅ Guardian Background Service 已启动');

