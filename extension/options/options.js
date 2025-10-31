// Guardian 设置页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    
    if (response && response.success && response.state) {
      const state = response.state;
      
      document.getElementById('enableProtection').checked = state.enabled || false;
      document.getElementById('mode').value = state.mode || 'blacklist';
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

function setupEventListeners() {
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const enabled = document.getElementById('enableProtection').checked;
    const mode = document.getElementById('mode').value;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'updateConfig',
        data: {
          enabled: enabled,
          mode: mode
        }
      });
      
      if (response && response.success) {
        showMessage('设置已保存', 'success');
      } else {
        showMessage('保存失败', 'error');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      showMessage('保存失败', 'error');
    }
  });
}

function showMessage(text, type = 'success') {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = `message ${type} show`;
  
  setTimeout(() => {
    message.classList.remove('show');
  }, 3000);
}

