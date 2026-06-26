# 📝 Quick Notes - Chrome 快捷笔记插件

> 随时记录灵感与待办事项，轻量、快速、开源。

## 功能特点

- ✅ 笔记记录：输入即保存，本地存储
- ✅ 笔记列表：最新笔记置顶显示
- ✅ 快捷删除：每条笔记可单独删除
- ✅ 数据本地化：所有数据存储在 Chrome 本地，不上传服务器
- ✅ 极简 UI：专注核心功能，无干扰

## 安装方式

1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择本项目文件夹即可

## 项目结构

```
chrome-extension/
├── manifest.json      # 插件配置文件
├── popup.html        # 弹窗主页面
├── popup.js          # 弹窗交互逻辑
├── background.js     # 后台 Service Worker
└── icons/            # 图标资源
```

## 快捷键

- `Enter` — 保存笔记
- `Ctrl + Enter` — 换行

## 技术栈

- Chrome Extension Manifest V3
- Chrome Storage API
- 原生 HTML/CSS/JS，无任何依赖

## 跨设备同步

本项目代码托管于 GitHub，两台电脑（Mac / Windows）均通过 GitHub 同步开发。
