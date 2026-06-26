// Background Service Worker - Chrome Extension v1.0
// 负责处理扩展生命周期事件

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Quick Notes 插件已安装 v1.0.0', details.reason);
  
  // 首次安装时初始化默认数据
  if (details.reason === 'install') {
    chrome.storage.local.set({ quick_notes_v1: [] });
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome 启动，加载 Quick Notes');
});
